import {
  ANIME_EPISODE_STATUSES,
  ANIME_EPISODE_TYPES,
  ANIME_SEASON_KINDS,
  type LocalizationLocale,
} from '@hayasedb/domain'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from './_columns'
import { anime } from './anime'
import { entity } from './contribution'
import { mediaAsset } from './media'

export const animeSeasonKind = pgEnum('anime_season_kind', ANIME_SEASON_KINDS)
export const animeEpisodeType = pgEnum(
  'anime_episode_type',
  ANIME_EPISODE_TYPES,
)
export const animeEpisodeStatus = pgEnum(
  'anime_episode_status',
  ANIME_EPISODE_STATUSES,
)

export const animeSeason = pgTable(
  'anime_season',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => entity.id),
    animeId: uuid('anime_id')
      .notNull()
      .references(() => anime.id, { onDelete: 'cascade' }),
    kind: animeSeasonKind('kind').notNull(),
    number: numeric('number', { precision: 8, scale: 3 }),
    position: integer('position').notNull(),
    ...timestamps(),
  },
  (table) => [
    unique('anime_season_anime_position_uq').on(table.animeId, table.position),
    uniqueIndex('anime_season_anime_kind_number_uq')
      .on(table.animeId, table.kind, table.number)
      .where(sql`${table.number} is not null`),
    check('anime_season_position_check', sql`${table.position} >= 0`),
    check(
      'anime_season_number_check',
      sql`${table.number} is null or ${table.number} >= 0`,
    ),
  ],
)

export const animeEpisode = pgTable(
  'anime_episode',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => entity.id),
    animeId: uuid('anime_id').references(() => anime.id, {
      onDelete: 'cascade',
    }),
    seasonId: uuid('season_id').references(() => animeSeason.id, {
      onDelete: 'cascade',
    }),
    number: numeric('number', { precision: 8, scale: 3 }),
    position: integer('position').notNull(),
    type: animeEpisodeType('type').notNull(),
    status: animeEpisodeStatus('status').notNull(),
    airDate: date('air_date'),
    durationSeconds: integer('duration_seconds'),
    stillMediaId: uuid('still_media_id').references(() => mediaAsset.id, {
      onDelete: 'restrict',
    }),
    ...timestamps(),
  },
  (table) => [
    unique('anime_episode_anime_position_uq').on(table.animeId, table.position),
    unique('anime_episode_season_position_uq').on(
      table.seasonId,
      table.position,
    ),
    uniqueIndex('anime_episode_anime_type_number_uq')
      .on(table.animeId, table.type, table.number)
      .where(sql`${table.animeId} is not null and ${table.number} is not null`),
    uniqueIndex('anime_episode_season_type_number_uq')
      .on(table.seasonId, table.type, table.number)
      .where(
        sql`${table.seasonId} is not null and ${table.number} is not null`,
      ),
    index('anime_episode_still_media_idx').on(table.stillMediaId),
    check(
      'anime_episode_owner_check',
      sql`num_nonnulls(${table.animeId}, ${table.seasonId}) = 1`,
    ),
    check('anime_episode_position_check', sql`${table.position} >= 0`),
    check(
      'anime_episode_number_check',
      sql`${table.number} is null or ${table.number} >= 0`,
    ),
    check(
      'anime_episode_duration_check',
      sql`${table.durationSeconds} is null or ${table.durationSeconds} > 0`,
    ),
  ],
)

export const animeSeasonTranslation = pgTable(
  'anime_season_translation',
  {
    seasonId: uuid('season_id')
      .notNull()
      .references(() => animeSeason.id, { onDelete: 'cascade' }),
    locale: text('locale').$type<LocalizationLocale>().notNull(),
    title: text('title').notNull(),
    original: boolean('original').default(false).notNull(),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.seasonId, table.locale] }),
    uniqueIndex('anime_season_translation_original_uq')
      .on(table.seasonId)
      .where(sql`${table.original}`),
  ],
)

export const animeEpisodeTranslation = pgTable(
  'anime_episode_translation',
  {
    episodeId: uuid('episode_id')
      .notNull()
      .references(() => animeEpisode.id, { onDelete: 'cascade' }),
    locale: text('locale').$type<LocalizationLocale>().notNull(),
    title: text('title').notNull(),
    overview: text('overview'),
    original: boolean('original').default(false).notNull(),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.episodeId, table.locale] }),
    uniqueIndex('anime_episode_translation_original_uq')
      .on(table.episodeId)
      .where(sql`${table.original}`),
  ],
)

export const animeSeasonRelations = relations(animeSeason, ({ one, many }) => ({
  anime: one(anime, {
    fields: [animeSeason.animeId],
    references: [anime.id],
  }),
  episodes: many(animeEpisode),
  translations: many(animeSeasonTranslation),
}))

export const animeEpisodeRelations = relations(
  animeEpisode,
  ({ one, many }) => ({
    anime: one(anime, {
      fields: [animeEpisode.animeId],
      references: [anime.id],
    }),
    season: one(animeSeason, {
      fields: [animeEpisode.seasonId],
      references: [animeSeason.id],
    }),
    still: one(mediaAsset, {
      fields: [animeEpisode.stillMediaId],
      references: [mediaAsset.id],
    }),
    translations: many(animeEpisodeTranslation),
  }),
)

export const animeSeasonTranslationRelations = relations(
  animeSeasonTranslation,
  ({ one }) => ({
    season: one(animeSeason, {
      fields: [animeSeasonTranslation.seasonId],
      references: [animeSeason.id],
    }),
  }),
)

export const animeEpisodeTranslationRelations = relations(
  animeEpisodeTranslation,
  ({ one }) => ({
    episode: one(animeEpisode, {
      fields: [animeEpisodeTranslation.episodeId],
      references: [animeEpisode.id],
    }),
  }),
)
