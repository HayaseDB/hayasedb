import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../../rbac/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', unique: true, length: 50, nullable: false })
  username: string;

  @Index()
  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null;

  @Exclude()
  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  emailVerificationToken: string | null;

  @Column({
    name: 'email_verification_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }
}
