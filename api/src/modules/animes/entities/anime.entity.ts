import slugify from 'slugify';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Contributable } from '../../contributions/decorators/contributable.decorator';
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

  @Contributable
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Contributable
  @Column({ type: 'text', nullable: true })
  synopsis: string | null;

  @Contributable
  @Index()
  @Column({
    type: 'enum',
    enum: AnimeFormat,
    nullable: false,
  })
  format: AnimeFormat;

  @Contributable
  @Index()
  @Column({
    type: 'enum',
    enum: AnimeStatus,
    nullable: false,
  })
  status: AnimeStatus;

  @Contributable
  @Index()
  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Contributable
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

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title) {
      this.slug = slugify(this.title, { lower: true, strict: true });
    }
  }
}
