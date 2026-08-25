import type { SeedUser } from '../../../types'

export const SEED_ADMIN: SeedUser = {
  email: 'admin@demo.hayasedb.test',
  name: 'Demo Admin',
  password: 'demo-admin-password',
  role: 'admin',
  avatar: 'avatar-admin.webp',
}

export const SEED_MIKA: SeedUser = {
  email: 'mika@demo.hayasedb.test',
  name: 'Mika Tanaka',
  password: 'demo-user-password',
  role: 'user',
  avatar: 'avatar-mika.webp',
}

export const SEED_JONAS: SeedUser = {
  email: 'jonas@demo.hayasedb.test',
  name: 'Jonas Weber',
  password: 'demo-user-password',
  role: 'user',
  avatar: 'avatar-jonas.webp',
}

export const SEED_USERS: SeedUser[] = [SEED_ADMIN, SEED_MIKA, SEED_JONAS]
