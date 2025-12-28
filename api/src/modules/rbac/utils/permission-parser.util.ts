import { ParsedPermission } from '../interfaces/permission.interface';

export function parsePermission(permission: string): ParsedPermission {
  const [resourceAction, scope] = permission.split(':');
  const [resource, action] = resourceAction.split('@');

  if (!resource || !action) {
    throw new Error(
      `Invalid permission format: ${permission}. Expected 'resource@action[:scope]'`,
    );
  }

  return {
    resource,
    action,
    scope,
  };
}

export function permissionCovers(
  granted: ParsedPermission,
  required: ParsedPermission,
): boolean {
  if (granted.resource !== required.resource && granted.resource !== '*') {
    return false;
  }

  if (granted.action !== required.action && granted.action !== '*') {
    return false;
  }

  if (required.scope) {
    if (!granted.scope) return false;
    if (granted.scope === 'any') return true;
    if (granted.scope === required.scope) return true;
    return false;
  }

  return true;
}

export function permissionToString(permission: ParsedPermission): string {
  return `${permission.resource}@${permission.action}${permission.scope ? ':' + permission.scope : ''}`;
}
