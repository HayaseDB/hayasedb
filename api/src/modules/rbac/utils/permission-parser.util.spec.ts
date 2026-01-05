import {
  parsePermission,
  permissionCovers,
  permissionToString,
} from './permission-parser.util';

describe('permission-parser.util', () => {
  describe('parsePermission', () => {
    it('should parse permission with scope', () => {
      const result = parsePermission('users@read:own');

      expect(result).toEqual({
        resource: 'users',
        action: 'read',
        scope: 'own',
      });
    });

    it('should parse permission without scope', () => {
      const result = parsePermission('users@read');

      expect(result).toEqual({
        resource: 'users',
        action: 'read',
        scope: undefined,
      });
    });

    it('should throw error for invalid format without action', () => {
      expect(() => parsePermission('users')).toThrow(
        'Invalid permission format',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => parsePermission('')).toThrow('Invalid permission format');
    });
  });

  describe('permissionCovers', () => {
    it('should return true for exact match', () => {
      const granted = parsePermission('users@read:own');
      const required = parsePermission('users@read:own');

      expect(permissionCovers(granted, required)).toBe(true);
    });

    it('should return true when granted has any scope and required has own', () => {
      const granted = parsePermission('users@read:any');
      const required = parsePermission('users@read:own');

      expect(permissionCovers(granted, required)).toBe(true);
    });

    it('should return false when granted has own scope and required has any', () => {
      const granted = parsePermission('users@read:own');
      const required = parsePermission('users@read:any');

      expect(permissionCovers(granted, required)).toBe(false);
    });

    it('should return false when resources differ', () => {
      const granted = parsePermission('users@read:any');
      const required = parsePermission('sessions@read:any');

      expect(permissionCovers(granted, required)).toBe(false);
    });

    it('should return false when actions differ', () => {
      const granted = parsePermission('users@read:any');
      const required = parsePermission('users@update:any');

      expect(permissionCovers(granted, required)).toBe(false);
    });

    it('should return true when granted has wildcard resource', () => {
      const granted = parsePermission('*@read:any');
      const required = parsePermission('users@read:any');

      expect(permissionCovers(granted, required)).toBe(true);
    });

    it('should return true when granted has wildcard action', () => {
      const granted = parsePermission('users@*:any');
      const required = parsePermission('users@read:any');

      expect(permissionCovers(granted, required)).toBe(true);
    });

    it('should return true when required has no scope and granted has no scope', () => {
      const granted = parsePermission('users@read');
      const required = parsePermission('users@read');

      expect(permissionCovers(granted, required)).toBe(true);
    });

    it('should return false when required has scope but granted has no scope', () => {
      const granted = parsePermission('users@read');
      const required = parsePermission('users@read:own');

      expect(permissionCovers(granted, required)).toBe(false);
    });
  });

  describe('permissionToString', () => {
    it('should convert permission with scope to string', () => {
      const permission = { resource: 'users', action: 'read', scope: 'own' };

      expect(permissionToString(permission)).toBe('users@read:own');
    });

    it('should convert permission without scope to string', () => {
      const permission = { resource: 'users', action: 'read' };

      expect(permissionToString(permission)).toBe('users@read');
    });
  });
});
