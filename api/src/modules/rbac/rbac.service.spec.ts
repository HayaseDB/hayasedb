import { Test, TestingModule } from '@nestjs/testing';

import { RbacService } from './rbac.service';
import type { Permission, RoleKey } from './rbac.types';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbacService],
    }).compile();

    service = module.get<RbacService>(RbacService);
    service.onModuleInit();
  });

  describe('hasPermission', () => {
    it('should return true when administrator has any permission', () => {
      const roles: RoleKey[] = ['global:administrator'];

      expect(
        service.hasPermission(roles, 'global:users.read:any' as Permission),
      ).toBe(true);
      expect(
        service.hasPermission(roles, 'global:users.delete:any' as Permission),
      ).toBe(true);
      expect(
        service.hasPermission(roles, 'global:animes.create' as Permission),
      ).toBe(true);
    });

    it('should return true when user has own permission', () => {
      const roles: RoleKey[] = ['global:user'];

      expect(
        service.hasPermission(roles, 'global:users.read:own' as Permission),
      ).toBe(true);
      expect(
        service.hasPermission(roles, 'global:users.update:own' as Permission),
      ).toBe(true);
    });

    it('should return false when user lacks permission', () => {
      const roles: RoleKey[] = ['global:user'];

      expect(
        service.hasPermission(roles, 'global:users.read:any' as Permission),
      ).toBe(false);
      expect(
        service.hasPermission(roles, 'global:animes.create' as Permission),
      ).toBe(false);
    });

    it('should return true for :own if user has :any permission', () => {
      const roles: RoleKey[] = ['global:administrator'];

      expect(
        service.hasPermission(roles, 'global:users.read:own' as Permission),
      ).toBe(true);
    });

    it('should return false when role does not exist', () => {
      const roles = ['global:nonexistent'] as unknown as RoleKey[];

      expect(
        service.hasPermission(roles, 'global:users.read:own' as Permission),
      ).toBe(false);
    });

    it('should check multiple roles and return true if any has permission', () => {
      const roles: RoleKey[] = ['global:user', 'global:moderator'];

      expect(
        service.hasPermission(roles, 'global:animes.create' as Permission),
      ).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const roles: RoleKey[] = ['global:user'];
      const permissions: Permission[] = [
        'global:users.read:any' as Permission,
        'global:users.read:own' as Permission,
      ];

      expect(service.hasAnyPermission(roles, permissions)).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const roles: RoleKey[] = ['global:user'];
      const permissions: Permission[] = [
        'global:users.read:any' as Permission,
        'global:animes.create' as Permission,
      ];

      expect(service.hasAnyPermission(roles, permissions)).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      const roles: RoleKey[] = ['global:user'];

      expect(service.hasAnyPermission(roles, [])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const roles: RoleKey[] = ['global:administrator'];
      const permissions: Permission[] = [
        'global:users.read:own' as Permission,
        'global:users.update:own' as Permission,
        'global:animes.create' as Permission,
      ];

      expect(service.hasAllPermissions(roles, permissions)).toBe(true);
    });

    it('should return false when user lacks one permission', () => {
      const roles: RoleKey[] = ['global:user'];
      const permissions: Permission[] = [
        'global:users.read:own' as Permission,
        'global:animes.create' as Permission,
      ];

      expect(service.hasAllPermissions(roles, permissions)).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      const roles: RoleKey[] = ['global:user'];

      expect(service.hasAllPermissions(roles, [])).toBe(true);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for administrator', () => {
      const permissions = service.getPermissionsForRole('global:administrator');

      expect(permissions).toContain('global:users.read:own');
      expect(permissions).toContain('global:users.read:any');
      expect(permissions).toContain('global:animes.create');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return permissions for user role', () => {
      const permissions = service.getPermissionsForRole('global:user');

      expect(permissions).toContain('global:users.read:own');
      expect(permissions).toContain('global:users.update:own');
      expect(permissions).not.toContain('global:users.read:any');
    });

    it('should return empty array for non-existent role', () => {
      const permissions = service.getPermissionsForRole(
        'global:nonexistent' as RoleKey,
      );

      expect(permissions).toEqual([]);
    });
  });

  describe('can', () => {
    it('should return true when role has permission', () => {
      expect(service.can('global:administrator', 'users.read:any')).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      expect(service.can('global:user', 'users.read:any')).toBe(false);
    });

    it('should return false for non-existent role', () => {
      expect(service.can('global:nonexistent', 'users.read:any')).toBe(false);
    });
  });

  describe('allowedFields', () => {
    it('should return field variants for user actions', () => {
      const fields = service.allowedFields('global:user', 'users.read');

      expect(fields).toContain('own');
      expect(fields).not.toContain('any');
    });

    it('should return all field variants for administrator', () => {
      const fields = service.allowedFields(
        'global:administrator',
        'users.read',
      );

      expect(fields).toContain('own');
      expect(fields).toContain('any');
    });

    it('should return empty array for non-existent role', () => {
      const fields = service.allowedFields('global:nonexistent', 'users.read');

      expect(fields).toEqual([]);
    });

    it('should return empty array when role has no field permissions', () => {
      const fields = service.allowedFields('global:user', 'rbac.manage');

      expect(fields).toEqual([]);
    });
  });

  describe('filter', () => {
    it('should filter object to only allowed fields', () => {
      const data = {
        own: 'value1',
        any: 'value2',
        other: 'value3',
      };

      const result = service.filter('global:user', 'users.read', data);

      expect(result).toEqual({ own: 'value1' });
    });

    it('should return empty object when no fields allowed', () => {
      const data = { field1: 'value1', field2: 'value2' };

      const result = service.filter('global:nonexistent', 'users.read', data);

      expect(result).toEqual({});
    });

    it('should return all matching fields for administrator', () => {
      const data = {
        own: 'value1',
        any: 'value2',
        other: 'value3',
      };

      const result = service.filter('global:administrator', 'users.read', data);

      expect(result).toEqual({ own: 'value1', any: 'value2' });
    });
  });

  describe('pattern matching', () => {
    it('should expand wildcard patterns correctly', () => {
      const permissions = service.getPermissionsForRole('global:user');

      expect(permissions).toContain('global:contributions.create:own');
      expect(permissions).toContain('global:contributions.read:own');
      expect(permissions).toContain('global:contributions.update:own');
      expect(permissions).toContain('global:contributions.delete:own');
    });

    it('should handle specific action patterns', () => {
      const permissions = service.getPermissionsForRole('global:moderator');

      expect(permissions).toContain('global:contributions.review:any');
      expect(permissions).toContain('global:animes.create');
      expect(permissions).toContain('global:animes.update');
      expect(permissions).not.toContain('global:animes.delete');
    });
  });
});
