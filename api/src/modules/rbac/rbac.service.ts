import { Injectable } from '@nestjs/common';

import { Role } from './enums/role.enum';
import { ParsedPermission } from './interfaces/permission.interface';
import { RBAC_CONFIG } from './rbac.config';
import {
  parsePermission,
  permissionCovers,
  permissionToString,
} from './utils/permission-parser.util';

@Injectable()
export class RbacService {
  private readonly resolvedPermissions: Map<Role, ParsedPermission[]>;

  constructor() {
    this.resolvedPermissions = this.resolveAllPermissions();
  }

  private resolveAllPermissions(): Map<Role, ParsedPermission[]> {
    const resolved = new Map<Role, ParsedPermission[]>();

    const resolve = (
      role: Role,
      visited: Set<Role> = new Set(),
    ): ParsedPermission[] => {
      if (resolved.has(role)) {
        return resolved.get(role)!;
      }

      if (visited.has(role)) {
        throw new Error(`Circular inheritance detected for role: ${role}`);
      }
      visited.add(role);

      const config = RBAC_CONFIG[role];
      const permissions: ParsedPermission[] = [];

      if (config.inherits) {
        for (const inheritedRole of config.inherits) {
          permissions.push(...resolve(inheritedRole, visited));
        }
      }

      for (const permissionStr of config.permissions) {
        permissions.push(parsePermission(permissionStr));
      }

      resolved.set(role, permissions);
      return permissions;
    };

    for (const role of Object.values(Role)) {
      resolve(role);
    }

    return resolved;
  }

  can(role: Role, permission: string): boolean {
    const required = parsePermission(permission);
    const granted = this.resolvedPermissions.get(role) ?? [];

    return granted.some((g) => permissionCovers(g, required));
  }

  canAny(role: Role, permissions: string[]): boolean {
    return permissions.some((p) => this.can(role, p));
  }

  canAll(role: Role, permissions: string[]): boolean {
    return permissions.every((p) => this.can(role, p));
  }

  getPermissionsForRole(role: Role): string[] {
    const permissions = this.resolvedPermissions.get(role) ?? [];
    return permissions.map((p) => permissionToString(p));
  }

  getAllRoles(): Role[] {
    return Object.values(Role);
  }
}
