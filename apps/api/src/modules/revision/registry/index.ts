import type { EntityKind } from '@hayasedb/domain'
import { animeHandler } from './anime.handler'
import { episodeHandler } from './episode.handler'
import { genreHandler } from './genre.handler'
import { seasonHandler } from './season.handler'
import type { EntityKindHandler } from './types'

const ENTITY_REGISTRY: Record<EntityKind, EntityKindHandler> = {
  anime: animeHandler,
  animeSeason: seasonHandler,
  animeEpisode: episodeHandler,
  genre: genreHandler,
}

export function entityHandler(kind: EntityKind): EntityKindHandler {
  const handler = ENTITY_REGISTRY[kind]
  if (!handler) {
    throw new Error(`No revision handler registered for entity kind: ${kind}`)
  }
  return handler
}

export * from './types'
