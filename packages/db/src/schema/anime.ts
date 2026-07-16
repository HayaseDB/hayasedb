import {
  ANIME_FORMATS,
  ANIME_MEDIA_TYPES,
  ANIME_STATUSES,
} from '@hayasedb/domain'
import { relations, sql } from 'drizzle-orm'
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { entity } from './contribution'

const uuidV7Pk = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)

export const animeFormat = pgEnum('anime_format', ANIME_FORMATS)

export const animeStatus = pgEnum('anime_status', ANIME_STATUSES)

export const animeMediaType = pgEnum('anime_media_type', ANIME_MEDIA_TYPES)

export const anime = pgTable('anime', {
  id: uuidV7Pk().references(() => entity.id),
  slug: text('slug').notNull().unique(),
  format: animeFormat('format'),
  status: animeStatus('status'),
  titleRomaji: text('title_romaji'),
  titleEnglish: text('title_english'),
  titleNative: text('title_native'),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const genre = pgTable('genre', {
  id: uuidV7Pk(),
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

export const mediaAsset = pgTable(
  'media_asset',
  {
    id: uuidV7Pk(),
    storageKey: text('storage_key').notNull().unique(),
    bucket: text('bucket').notNull(),
    checksumSha256: text('checksum_sha256').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width'),
    height: integer('height'),
    blurhash: text('blurhash'),
    originalFilename: text('original_filename'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    check(
      'media_asset_mime_type_check',
      sql`${table.mimeType} in ('image/webp', 'image/jpeg', 'image/png', 'image/avif')`,
    ),
  ],
)

export const mediaUpload = pgTable(
  'media_upload',
  {
    id: uuidV7Pk(),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    uploaderId: text('uploader_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('media_upload_uploader_idx').on(table.uploaderId, table.createdAt),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
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

export const mediaAssetRelations = relations(mediaAsset, ({ many }) => ({
  attachments: many(animeMedia),
  uploads: many(mediaUpload),
}))

export const mediaUploadRelations = relations(mediaUpload, ({ one }) => ({
  asset: one(mediaAsset, {
    fields: [mediaUpload.mediaAssetId],
    references: [mediaAsset.id],
  }),
  uploader: one(user, {
    fields: [mediaUpload.uploaderId],
    references: [user.id],
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
