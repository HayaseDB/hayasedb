import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Anime } from '../../animes/entities/anime.entity';

@Entity('genres')
@Index(['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  slug: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @VersionColumn({ default: 1 })
  version: number;

  @Index()
  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User | null;

  @ManyToMany(() => Anime, (anime) => anime.genres)
  animes: Anime[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
