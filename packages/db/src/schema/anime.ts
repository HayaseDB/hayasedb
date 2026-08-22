import {
  ANIME_FORMATS,
  ANIME_MEDIA_TYPES,
  ANIME_RELATION_KINDS,
  ANIME_STATUSES,
  SYMMETRIC_RELATION_KINDS,
} from '@hayasedb/domain'
import { relations, sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { createdAt, timestamps, uuidV7Pk } from './_columns'
import { entity } from './contribution'
import { mediaAsset } from './media'

export const animeFormat = pgEnum('anime_format', ANIME_FORMATS)

export const animeStatus = pgEnum('anime_status', ANIME_STATUSES)

export const animeMediaType = pgEnum('anime_media_type', ANIME_MEDIA_TYPES)

export const animeRelationKind = pgEnum(
  'anime_relation_kind',
  ANIME_RELATION_KINDS,
)

const symmetricKindList = sql.raw(
  SYMMETRIC_RELATION_KINDS.map((kind) => `'${kind}'`).join(', '),
)

export const anime = pgTable(
  'anime',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => entity.id),
    slug: text('slug').notNull().unique(),
    format: animeFormat('format'),
    status: animeStatus('status'),
    titleRomaji: text('title_romaji'),
    titleEnglish: text('title_english'),
    titleNative: text('title_native'),
    description: text('description'),
    startYear: smallint('start_year'),
    startMonth: smallint('start_month'),
    startDay: smallint('start_day'),
    endYear: smallint('end_year'),
    endMonth: smallint('end_month'),
    endDay: smallint('end_day'),
    ...timestamps(),
  },
  (table) => [
    index('anime_status_idx').on(table.status),
    index('anime_format_idx').on(table.format),
    index('anime_start_idx').on(
      table.startYear,
      table.startMonth,
      table.startDay,
    ),
    index('anime_created_at_idx').on(table.createdAt),
    check(
      'anime_start_date_check',
      sql`(${table.startMonth} is null or (${table.startYear} is not null and ${table.startMonth} between 1 and 12)) and (${table.startDay} is null or (${table.startMonth} is not null and ${table.startDay} between 1 and 31))`,
    ),
    check(
      'anime_end_date_check',
      sql`(${table.endMonth} is null or (${table.endYear} is not null and ${table.endMonth} between 1 and 12)) and (${table.endDay} is null or (${table.endMonth} is not null and ${table.endDay} between 1 and 31))`,
    ),
  ],
)

export const animeRelation = pgTable(
  'anime_relation',
  {
    sourceId: uuid('source_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    kind: animeRelationKind('kind').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourceId, table.targetId, table.kind] }),
    index('anime_relation_target_id_idx').on(table.targetId),
    check(
      'anime_relation_not_self_check',
      sql`${table.sourceId} <> ${table.targetId}`,
    ),
    check(
      'anime_relation_symmetric_order_check',
      sql`${table.kind} not in (${symmetricKindList}) or ${table.sourceId} < ${table.targetId}`,
    ),
  ],
)

export const genre = pgTable('genre', {
  id: uuid('id')
    .primaryKey()
    .references(() => entity.id),
  name: text('name').notNull().unique(),
})

export const animeGenre = pgTable(
  'anime_genre',
  {
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => genre.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.animeId, table.genreId] }),
    index('anime_genre_genre_id_idx').on(table.genreId),
  ],
)

export const animeMedia = pgTable(
  'anime_media',
  {
    id: uuidV7Pk(),
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'restrict' }),
    type: animeMediaType('type').notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index('anime_media_anime_id_type_idx').on(
      table.animeId,
      table.type,
      table.position,
    ),
    uniqueIndex('anime_media_anime_media_type_uq').on(
      table.animeId,
      table.mediaId,
      table.type,
    ),
  ],
)

export const animeRelations = relations(anime, ({ many }) => ({
  genres: many(animeGenre),
  media: many(animeMedia),
  outgoingRelations: many(animeRelation, { relationName: 'source' }),
  incomingRelations: many(animeRelation, { relationName: 'target' }),
}))

export const animeRelationRelations = relations(animeRelation, ({ one }) => ({
  source: one(anime, {
    fields: [animeRelation.sourceId],
    references: [anime.id],
    relationName: 'source',
  }),
  target: one(anime, {
    fields: [animeRelation.targetId],
    references: [anime.id],
    relationName: 'target',
  }),
}))

export const genreRelations = relations(genre, ({ many }) => ({
  anime: many(animeGenre),
}))

export const animeGenreRelations = relations(animeGenre, ({ one }) => ({
  anime: one(anime, {
    fields: [animeGenre.animeId],
    references: [anime.id],
  }),
  genre: one(genre, {
    fields: [animeGenre.genreId],
    references: [genre.id],
  }),
}))

export const animeMediaRelations = relations(animeMedia, ({ one }) => ({
  anime: one(anime, {
    fields: [animeMedia.animeId],
    references: [anime.id],
  }),
  asset: one(mediaAsset, {
    fields: [animeMedia.mediaId],
    references: [mediaAsset.id],
  }),
}))
