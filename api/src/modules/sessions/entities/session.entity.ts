import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { DeviceType } from '../../../common/types/request-metadata.interface';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @Exclude()
  user: User;

  @Column({ length: 255 })
  @Exclude()
  hash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string | null;

  @Column({
    type: 'varchar',
    name: 'browser_version',
    length: 50,
    nullable: true,
  })
  browserVersion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  os: string | null;

  @Column({ type: 'varchar', name: 'os_version', length: 50, nullable: true })
  osVersion: string | null;

  @Column({
    name: 'device_type',
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.UNKNOWN,
  })
  deviceType: DeviceType;

  @Column({ type: 'varchar', name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  @Exclude()
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
