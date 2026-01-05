import * as crypto from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import { MoreThan, Repository } from 'typeorm';

import { Media } from '../media/entities/media.entity';
import { CreateMediaInput, MediaService } from '../media/media.service';
import { StorageService } from '../../storage/storage.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  PROFILE_PICTURE_BUCKET,
  PROFILE_PICTURE_OUTPUT_SIZE,
} from './constants/profile-picture.constants';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const email = createUserDto.email.toLowerCase();
    const username = createUserDto.username.toLowerCase();

    const existingEmail = await this.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    });

    return await this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email) {
      const newEmail = updateUserDto.email.toLowerCase();
      if (newEmail !== user.email) {
        const existingUser = await this.findByEmail(newEmail);
        if (existingUser) {
          throw new ConflictException('Email already taken');
        }
        user.email = newEmail;
      }
    }

    if (updateUserDto.username) {
      const newUsername = updateUserDto.username.toLowerCase();
      if (newUsername !== user.username) {
        const existingUser = await this.findByUsername(newUsername);
        if (existingUser) {
          throw new ConflictException('Username already taken');
        }
        user.username = newUsername;
      }
    }

    if (updateUserDto.firstName) {
      user.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName) {
      user.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return await this.userRepository.save(user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findOne(userId);

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userRepository.save(user);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async generateVerificationToken(userId: string): Promise<string> {
    const user = await this.findOne(userId);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    user.emailVerificationToken = token;
    user.emailVerificationExpiresAt = expiresAt;

    await this.userRepository.save(user);

    return token;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: MoreThan(new Date()),
      },
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const user = await this.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;

    return await this.userRepository.save(user);
  }

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOne(userId);
    const oldProfilePicture = user.profilePicture;

    const processedImage = await this.processProfilePicture(file.buffer);
    const objectKey = `${userId}/${Date.now()}.webp`;

    await this.storageService.ensureBucket(PROFILE_PICTURE_BUCKET, true);

    const uploadResult = await this.storageService.uploadFile(
      PROFILE_PICTURE_BUCKET,
      objectKey,
      processedImage,
      {
        contentType: 'image/webp',
        size: processedImage.length,
      },
    );

    const mediaInput: CreateMediaInput = {
      bucket: PROFILE_PICTURE_BUCKET,
      key: objectKey,
      originalName: file.originalname,
      mimeType: 'image/webp',
      size: processedImage.length,
      etag: uploadResult.etag,
    };

    const newMedia = await this.mediaService.create(mediaInput);

    user.profilePicture = newMedia;
    const updatedUser = await this.userRepository.save(user);

    if (oldProfilePicture) {
      await this.deleteProfilePictureMedia(oldProfilePicture);
    }

    this.logger.log(`Profile picture updated for user ${userId}`);
    return updatedUser;
  }

  private async processProfilePicture(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || PROFILE_PICTURE_OUTPUT_SIZE;
    const height = metadata.height || PROFILE_PICTURE_OUTPUT_SIZE;
    const size = Math.min(width, height);

    return image
      .extract({
        left: Math.floor((width - size) / 2),
        top: Math.floor((height - size) / 2),
        width: size,
        height: size,
      })
      .resize(PROFILE_PICTURE_OUTPUT_SIZE, PROFILE_PICTURE_OUTPUT_SIZE)
      .webp({ quality: 85 })
      .toBuffer();
  }

  async deleteProfilePicture(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.profilePicture) {
      throw new NotFoundException('User does not have a profile picture');
    }

    const profilePictureToDelete = user.profilePicture;

    user.profilePicture = null;
    const updatedUser = await this.userRepository.save(user);

    await this.deleteProfilePictureMedia(profilePictureToDelete);

    this.logger.log(`Profile picture deleted for user ${userId}`);
    return updatedUser;
  }

  private async deleteProfilePictureMedia(media: Media): Promise<void> {
    await this.storageService.delete(media.bucket, media.key);
    await this.mediaService.hardDelete(media.id);
  }
}
