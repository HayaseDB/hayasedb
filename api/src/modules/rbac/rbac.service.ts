import { Injectable, OnModuleInit } from '@nestjs/common';

import { rbacConfig } from './rbac.config';
import { Permission, RoleKey } from './rbac.types';

@Injectable()
export class RbacService implements OnModuleInit {
  private rolePermissions = new Map<string, Set<string>>();
  private scopePermissions = new Map<string, Set<string>>();

  onModuleInit() {
    this.initialize();
  }

  private initialize() {
    for (const [scope, config] of Object.entries(rbacConfig.scopes)) {
      const allPerms = this.extractAllPermissions(
        scope,
        config.permissions as Record<
          string,
          | readonly string[]
          | { actions: readonly string[]; variants: readonly string[] }
        >,
      );
      this.scopePermissions.set(scope, allPerms);
    }

    for (const [scope, config] of Object.entries(rbacConfig.scopes)) {
      const scopePerms = this.scopePermissions.get(scope)!;
      for (const [role, patterns] of Object.entries(config.roles)) {
        const key = `${scope}:${role}`;
        const expanded = this.expandPatterns(
          scope,
          patterns as readonly string[],
          scopePerms,
        );
        this.rolePermissions.set(key, expanded);
      }
    }
  }

  private extractAllPermissions(
    scope: string,
    permissions: Record<
      string,
      | readonly string[]
      | { actions: readonly string[]; variants: readonly string[] }
    >,
  ): Set<string> {
    const result = new Set<string>();

    for (const [resource, config] of Object.entries(permissions)) {
      if (Array.isArray(config)) {
        for (const action of config) {
          result.add(`${scope}:${resource}.${action}`);
        }
      } else if (config && typeof config === 'object' && 'actions' in config) {
        const { actions, variants } = config as {
          actions: string[];
          variants: string[];
        };
        for (const action of actions) {
          result.add(`${scope}:${resource}.${action}`);
          for (const variant of variants) {
            result.add(`${scope}:${resource}.${action}:${variant}`);
          }
        }
      }
    }

    return result;
  }

  private expandPatterns(
    scope: string,
    patterns: readonly string[],
    allPerms: Set<string>,
  ): Set<string> {
    const result = new Set<string>();

    for (const pattern of patterns) {
      if (pattern === '*') {
        allPerms.forEach((p) => result.add(p));
      } else if (pattern.includes('*')) {
        const regex = this.patternToRegex(scope, pattern);
        allPerms.forEach((p) => {
          if (regex.test(p)) result.add(p);
        });
      } else {
        result.add(`${scope}:${pattern}`);
      }
    }

    return result;
  }

  private patternToRegex(scope: string, pattern: string): RegExp {
    const escaped = `${scope}:${pattern}`
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^:]+');
    return new RegExp(`^${escaped}$`);
  }

  hasPermission(roles: RoleKey[], permission: Permission): boolean {
    const required = permission as string;

    for (const role of roles) {
      const granted = this.rolePermissions.get(role);
      if (!granted) continue;

      if (granted.has(required)) return true;

      if (required.includes(':own')) {
        const anyVersion = required.replace(':own', ':any');
        if (granted.has(anyVersion)) return true;
      }
    }

    return false;
  }

  hasAnyPermission(roles: RoleKey[], permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(roles, p));
  }

  hasAllPermissions(roles: RoleKey[], permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(roles, p));
  }

  getPermissionsForRole(roleKey: RoleKey): string[] {
    const perms = this.rolePermissions.get(roleKey);
    return perms ? Array.from(perms) : [];
  }

  can(role: string, permission: string): boolean {
    const granted = this.rolePermissions.get(role);
    if (!granted) return false;

    const scope = role.split(':')[0];
    const fullPermission = permission.includes(':')
      ? `${scope}:${permission}`
      : `${scope}:${permission}`;

    return granted.has(fullPermission);
  }

  allowedFields(role: string, basePermission: string): string[] {
    const granted = this.rolePermissions.get(role);
    if (!granted) return [];

    const scope = role.split(':')[0];
    const prefix = `${scope}:${basePermission}:`;
    const fields: string[] = [];

    for (const perm of granted) {
      if (perm.startsWith(prefix)) {
        fields.push(perm.slice(prefix.length));
      }
    }

    return fields;
  }

  filter<T extends object>(
    role: string,
    basePermission: string,
    data: T,
  ): Partial<T> {
    const allowed = new Set(this.allowedFields(role, basePermission));
    if (allowed.size === 0) return {};

    const result: Partial<T> = {};
    for (const key of Object.keys(data) as (keyof T)[]) {
      if (allowed.has(key as string)) {
        result[key] = data[key];
      }
    }

    return result;
  }
}
