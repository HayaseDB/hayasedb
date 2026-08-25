import type { SeedSet } from '../../types'
import { SEED_ADMIN } from './data/users'
import {
  animeStep,
  apiKeysStep,
  avatarsStep,
  contributionsStep,
  genresStep,
  relationsStep,
  usersStep,
} from './steps'

export const demoSeedSet: SeedSet = {
  name: 'demo',
  description:
    'Curated real-world snapshot with users, genres, anime, relations and community activity',
  admin: SEED_ADMIN,
  assetsUrl: new URL('./assets/', import.meta.url),
  steps: [
    usersStep,
    avatarsStep,
    apiKeysStep,
    genresStep,
    animeStep,
    relationsStep,
    contributionsStep,
  ],
}
