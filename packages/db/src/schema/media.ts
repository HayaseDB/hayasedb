import { MEDIA_MIME_TYPES } from '@hayasedb/domain'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

const uuidV7Pk = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)

const mimeTypeList = sql.raw(
  MEDIA_MIME_TYPES.map((type) => `'${type}'`).join(', '),
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
      sql`${table.mimeType} in (${mimeTypeList})`,
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

export const userAvatar = pgTable(
  'user_avatar',
  {
    id: uuidV7Pk(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'restrict' }),
    isCurrent: boolean('is_current').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_avatar_user_id_idx').on(table.userId, table.createdAt),
    uniqueIndex('user_avatar_current_uq')
      .on(table.userId)
      .where(sql`${table.isCurrent}`),
  ],
)

export const mediaAssetRelations = relations(mediaAsset, ({ many }) => ({
  uploads: many(mediaUpload),
  avatars: many(userAvatar),
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

export const userAvatarRelations = relations(userAvatar, ({ one }) => ({
  user: one(user, {
    fields: [userAvatar.userId],
    references: [user.id],
  }),
  asset: one(mediaAsset, {
    fields: [userAvatar.mediaAssetId],
    references: [mediaAsset.id],
  }),
}))
