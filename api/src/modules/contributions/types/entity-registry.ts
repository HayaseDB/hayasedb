import { Type } from '@nestjs/common';

import { Anime } from '../../animes/entities/anime.entity';
import { Genre } from '../../genres/entities/genre.entity';
import { EntityType } from '../enums/entity-type.enum';

export const ENTITY_REGISTRY: Record<EntityType, Type<unknown>> = {
  [EntityType.ANIME]: Anime,
  [EntityType.GENRE]: Genre,
};

export function getEntityClass(entityType: EntityType): Type<unknown> {
  const entityClass = ENTITY_REGISTRY[entityType];
  if (!entityClass) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return entityClass;
}

export function getEntityTypeFromClass(
  entityClass: Type<unknown>,
): EntityType | null {
  for (const [type, cls] of Object.entries(ENTITY_REGISTRY)) {
    if (cls === entityClass) {
      return type as EntityType;
    }
  }
  return null;
}
