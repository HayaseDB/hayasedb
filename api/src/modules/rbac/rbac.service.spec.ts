import { Test, TestingModule } from '@nestjs/testing';

import { RbacService } from './rbac.service';
import { Role } from './enums/role.enum';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbacService],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  describe('can', () => {
    describe('USER role', () => {
      it('should have users@read:own permission', () => {
        expect(service.can(Role.USER, 'users@read:own')).toBe(true);
      });

      it('should have users@update:own permission', () => {
        expect(service.can(Role.USER, 'users@update:own')).toBe(true);
      });

      it('should have sessions@read:own permission', () => {
        expect(service.can(Role.USER, 'sessions@read:own')).toBe(true);
      });

      it('should NOT have users@read:any permission', () => {
        expect(service.can(Role.USER, 'users@read:any')).toBe(false);
      });

      it('should NOT have rbac@read:any permission', () => {
        expect(service.can(Role.USER, 'rbac@read:any')).toBe(false);
      });
    });

    describe('MODERATOR role', () => {
      it('should inherit USER permissions (users@read:own)', () => {
        expect(service.can(Role.MODERATOR, 'users@read:own')).toBe(true);
      });

      it('should have users@read:any permission', () => {
        expect(service.can(Role.MODERATOR, 'users@read:any')).toBe(true);
      });

      it('should have sessions@read:any permission', () => {
        expect(service.can(Role.MODERATOR, 'sessions@read:any')).toBe(true);
      });

      it('should NOT have users@update:any permission', () => {
        expect(service.can(Role.MODERATOR, 'users@update:any')).toBe(false);
      });
    });

    describe('ADMINISTRATOR role', () => {
      it('should inherit MODERATOR permissions (users@read:any)', () => {
        expect(service.can(Role.ADMINISTRATOR, 'users@read:any')).toBe(true);
      });

      it('should inherit USER permissions (users@read:own)', () => {
        expect(service.can(Role.ADMINISTRATOR, 'users@read:own')).toBe(true);
      });

      it('should have users@create:any permission', () => {
        expect(service.can(Role.ADMINISTRATOR, 'users@create:any')).toBe(true);
      });

      it('should have users@update:any permission', () => {
        expect(service.can(Role.ADMINISTRATOR, 'users@update:any')).toBe(true);
      });

      it('should have rbac@read:any permission', () => {
        expect(service.can(Role.ADMINISTRATOR, 'rbac@read:any')).toBe(true);
      });
    });

    describe('scope escalation prevention', () => {
      it('should allow any scope to cover own scope', () => {
        expect(service.can(Role.ADMINISTRATOR, 'users@read:own')).toBe(true);
      });

      it('should NOT allow own scope to cover any scope for USER', () => {
        expect(service.can(Role.USER, 'users@read:any')).toBe(false);
      });
    });
  });

  describe('canAny', () => {
    it('should return true if any permission is granted', () => {
      expect(
        service.canAny(Role.USER, ['users@read:any', 'users@read:own']),
      ).toBe(true);
    });

    it('should return false if no permissions are granted', () => {
      expect(
        service.canAny(Role.USER, ['users@create:any', 'rbac@read:any']),
      ).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      expect(service.canAny(Role.USER, [])).toBe(false);
    });
  });

  describe('canAll', () => {
    it('should return true if all permissions are granted', () => {
      expect(
        service.canAll(Role.USER, ['users@read:own', 'users@update:own']),
      ).toBe(true);
    });

    it('should return false if any permission is not granted', () => {
      expect(
        service.canAll(Role.USER, ['users@read:own', 'users@read:any']),
      ).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      expect(service.canAll(Role.USER, [])).toBe(true);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for USER including inherited', () => {
      const permissions = service.getPermissionsForRole(Role.USER);

      expect(permissions).toContain('users@read:own');
      expect(permissions).toContain('users@update:own');
      expect(permissions).toContain('sessions@read:own');
    });

    it('should return all permissions for MODERATOR including inherited from USER', () => {
      const permissions = service.getPermissionsForRole(Role.MODERATOR);

      expect(permissions).toContain('users@read:own');
      expect(permissions).toContain('users@read:any');
      expect(permissions).toContain('sessions@read:any');
    });

    it('should return all permissions for ADMINISTRATOR including inherited', () => {
      const permissions = service.getPermissionsForRole(Role.ADMINISTRATOR);

      expect(permissions).toContain('users@read:own');
      expect(permissions).toContain('users@read:any');
      expect(permissions).toContain('users@create:any');
      expect(permissions).toContain('rbac@read:any');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', () => {
      const roles = service.getAllRoles();

      expect(roles).toContain(Role.USER);
      expect(roles).toContain(Role.MODERATOR);
      expect(roles).toContain(Role.ADMINISTRATOR);
      expect(roles).toHaveLength(3);
    });
  });
});
