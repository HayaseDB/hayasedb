import { Injectable } from '@nestjs/common';

import { Role } from './enums/role.enum';
import { RBAC_CONFIG } from './rbac.config';
import { RbacService } from './rbac.service';

export interface RbacMatrixEntry {
  permission: string;
  roles: Record<Role, boolean>;
}

export interface RoleDetail {
  directPermissions: string[];
  inheritedFrom: Role[];
  totalPermissions: number;
}

export interface RbacMatrix {
  roles: Role[];
  permissions: RbacMatrixEntry[];
  roleDetails: Record<Role, RoleDetail>;
}

@Injectable()
export class RbacMatrixService {
  constructor(private readonly rbacService: RbacService) {}

  generateMatrix(): RbacMatrix {
    const roles = this.rbacService.getAllRoles();

    const allPermissions = new Set<string>();
    for (const role of roles) {
      const perms = this.rbacService.getPermissionsForRole(role);
      perms.forEach((p) => allPermissions.add(p));
    }

    const sortedPermissions = Array.from(allPermissions).sort();

    const permissions: RbacMatrixEntry[] = sortedPermissions.map(
      (permission) => ({
        permission,
        roles: roles.reduce(
          (acc, role) => {
            acc[role] = this.rbacService.can(role, permission);
            return acc;
          },
          {} as Record<Role, boolean>,
        ),
      }),
    );

    const roleDetails = roles.reduce(
      (acc, role) => {
        const config = RBAC_CONFIG[role];
        acc[role] = {
          directPermissions: config.permissions,
          inheritedFrom: config.inherits ?? [],
          totalPermissions: this.rbacService.getPermissionsForRole(role).length,
        };
        return acc;
      },
      {} as Record<Role, RoleDetail>,
    );

    return {
      roles,
      permissions,
      roleDetails,
    };
  }
}
