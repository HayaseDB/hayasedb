import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Genre } from '../../genres/entities/genre.entity';
import { AnimeFormat } from '../enums/anime-format.enum';
import { AnimeStatus } from '../enums/anime-status.enum';

@Entity('animes')
@Index(['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Anime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  slug: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  synopsis: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: AnimeFormat,
    nullable: false,
  })
  format: AnimeFormat;

  @Index()
  @Column({
    type: 'enum',
    enum: AnimeStatus,
    nullable: false,
  })
  status: AnimeStatus;

  @Index()
  @Column({ type: 'int', nullable: true })
  year: number | null;

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

  @ManyToMany(() => Genre, (genre) => genre.animes)
  @JoinTable({
    name: 'anime_genres',
    joinColumn: { name: 'anime_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Index()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
