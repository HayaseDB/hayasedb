import { Role } from './enums/role.enum';
import { RoleConfigMap } from './interfaces/permission.interface';

export const RBAC_CONFIG: RoleConfigMap = {
  [Role.USER]: {
    permissions: [
      'users@read:own',
      'users@update:own',
      'users@delete:own',
      'sessions@read:own',
      'sessions@delete:own',
      'contributions@create:own',
      'contributions@read:own',
      'contributions@update:own',
      'contributions@delete:own',
    ],
  },

  [Role.MODERATOR]: {
    inherits: [Role.USER],
    permissions: [
      'users@read:any',
      'sessions@read:any',
      'animes@create:any',
      'animes@update:any',
      'genres@create:any',
      'genres@update:any',
      'contributions@read:any',
      'contributions@review:any',
    ],
  },

  [Role.ADMINISTRATOR]: {
    inherits: [Role.MODERATOR],
    permissions: [
      'users@create:any',
      'users@update:any',
      'users@delete:any',
      'sessions@create:any',
      'sessions@update:any',
      'sessions@delete:any',
      'rbac@read:any',
      'animes@delete:any',
      'genres@delete:any',
    ],
  },
};
