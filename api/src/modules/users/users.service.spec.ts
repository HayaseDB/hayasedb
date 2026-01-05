import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { StorageService } from '../../storage/storage.service';
import { MediaService } from '../media/media.service';
import { SessionsService } from '../sessions/sessions.service';
import { MailService } from '../../mail/mail.service';
import {
  createMockRepository,
  MockRepository,
} from '../../../test/mocks/repository.mock';
import {
  createMockUser,
  createUnverifiedUser,
  resetUserFactory,
} from '../../../test/factories/user.factory';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    resetUserFactory();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: StorageService,
          useValue: {
            ensureBucket: jest.fn(),
            uploadFile: jest.fn(),
            delete: jest.fn(),
            getPresignedUrl: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByIdOrNull: jest.fn(),
            findByBucketAndKey: jest.fn(),
            delete: jest.fn(),
            hardDelete: jest.fn(),
            getUrl: jest.fn(),
            getUrlById: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            deleteAllForUser: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
            sendVerificationEmail: jest.fn(),
            sendAccountDeletionEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'NEW@Example.com',
      username: 'NewUser',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create a user with normalized email and username', async () => {
      repository.findOne!.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      const mockUser = createMockUser({
        email: 'new@example.com',
        username: 'newuser',
      });
      repository.create!.mockReturnValue(mockUser);
      repository.save!.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toBe(mockUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      repository.findOne!.mockResolvedValue(createMockUser());

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      repository
        .findOne!.mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createMockUser());

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = createMockUser({ id: 'test-id' });
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findOne('test-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user with normalized email', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user with normalized username', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByUsername('TestUser');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const existingUser = createMockUser();
      repository.findOne!.mockResolvedValue(existingUser);
      repository.save!.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update(existingUser.id, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingUser = createMockUser({ email: 'original@example.com' });
      const otherUser = createMockUser({ email: 'taken@example.com' });
      repository
        .findOne!.mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(otherUser);

      await expect(
        service.update(existingUser.id, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when updating to existing username', async () => {
      const existingUser = createMockUser({ username: 'original' });
      const otherUser = createMockUser({ username: 'taken' });
      repository
        .findOne!.mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(otherUser);

      await expect(
        service.update(existingUser.id, { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password when updating', async () => {
      const existingUser = createMockUser();
      repository.findOne!.mockResolvedValue(existingUser);
      repository.save!.mockImplementation((user) => Promise.resolve(user));
      mockBcrypt.hash.mockResolvedValue('new-hashed-password' as never);

      await service.update(existingUser.id, { password: 'newpassword' });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });
  });

  describe('changePassword', () => {
    it('should change password when current password is valid', async () => {
      const mockUser = createMockUser();
      const originalPassword = mockUser.password;
      repository.findOne!.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password' as never);
      repository.save!.mockResolvedValue(mockUser);

      await service.changePassword(mockUser.id, {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'oldpassword',
        originalPassword,
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.changePassword(mockUser.id, {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateCredentials', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateCredentials(
        mockUser.email,
        'password',
      );

      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.validateCredentials(
        'notfound@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateCredentials(
        mockUser.email,
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate token and set expiry using database time', async () => {
      const mockUser = createMockUser();
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.generateVerificationToken(mockUser.id);

      expect(result).toHaveLength(64);
      expect(repository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findByVerificationToken', () => {
    it('should find user with valid non-expired token', async () => {
      const mockUser = createUnverifiedUser();
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByVerificationToken('valid-token');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: 'valid-token',
          emailVerificationExpiresAt: expect.any(Object) as unknown,
        },
      });
      expect(result).toBe(mockUser);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and clear token using database NOW()', async () => {
      const mockUser = createUnverifiedUser();
      const verifiedUser = {
        ...mockUser,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      };

      repository
        .findOne!.mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(verifiedUser);

      const result = await service.verifyEmail('valid-token');

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(result.emailVerifiedAt).toBeInstanceOf(Date);
      expect(result.emailVerificationToken).toBeNull();
      expect(result.emailVerificationExpiresAt).toBeNull();
    });

    it('should throw BadRequestException for invalid token', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });
  });
});
