import { Role } from '../enums/role.enum';

export interface ParsedPermission {
  resource: string;
  action: string;
  scope?: string;
}

export interface RoleConfig {
  inherits?: Role[];
  permissions: string[];
}

export type RoleConfigMap = Record<Role, RoleConfig>;
