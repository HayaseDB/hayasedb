import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ContributionStatus } from '../enums/contribution-status.enum';
import { EntityType } from '../enums/entity-type.enum';

@Entity('contributions')
@Index(['status', 'submittedAt'])
@Index(['target'])
export class Contribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EntityType,
    nullable: false,
  })
  target: EntityType;

  @Column({ type: 'jsonb', nullable: false })
  data: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.DRAFT,
    nullable: false,
  })
  status: ContributionStatus;

  @Index()
  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'contributor_id' })
  contributor: User;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
