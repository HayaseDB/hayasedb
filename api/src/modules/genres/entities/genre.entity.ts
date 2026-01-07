import slugify from 'slugify';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Anime } from '../../animes/entities/anime.entity';
import { Contributable } from '../../contributions/decorators/contributable.decorator';

@Entity('genres')
@Index(['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  slug: string;

  @Contributable
  @Index()
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Contributable
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => Anime, (anime) => anime.genres)
  animes: Anime[];

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
    if (this.name) {
      this.slug = slugify(this.name, { lower: true, strict: true });
    }
  }
}
