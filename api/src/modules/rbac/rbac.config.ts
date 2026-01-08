export const rbacConfig = {
  scopes: {
    global: {
      permissions: {
        users: {
          actions: ['read', 'create', 'update', 'delete'],
          variants: ['own', 'any'],
        },
        sessions: {
          actions: ['read', 'create', 'update', 'delete'],
          variants: ['own', 'any'],
        },
        animes: ['create', 'update', 'delete'],
        genres: ['create', 'update', 'delete'],
        contributions: {
          actions: ['create', 'read', 'update', 'delete', 'review'],
          variants: ['own', 'any'],
        },
        rbac: ['read'],
      },
      roles: {
        administrator: ['*'],
        moderator: [
          'users.read:own',
          'users.update:own',
          'users.delete:own',
          'users.read:any',
          'sessions.read:own',
          'sessions.delete:own',
          'sessions.read:any',
          'animes.create',
          'animes.update',
          'genres.create',
          'genres.update',
          'contributions.*:own',
          'contributions.read:any',
          'contributions.review:any',
        ],
        user: [
          'users.read:own',
          'users.update:own',
          'users.delete:own',
          'sessions.read:own',
          'sessions.delete:own',
          'contributions.*:own',
        ],
      },
    },
  },
} as const;

export type RbacConfig = typeof rbacConfig;
