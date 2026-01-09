import { Session } from '../../src/modules/sessions/entities/session.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { DeviceType } from '../../src/common/types/request-metadata.interface';
import { createMockUser } from './user.factory';

let sessionIdCounter = 0;

export const resetSessionFactory = (): void => {
  sessionIdCounter = 0;
};

export const createMockSession = (
  overrides: Partial<Session> & { user?: User } = {},
): Session => {
  const id = overrides.id ?? `session-${++sessionIdCounter}`;
  const now = new Date();

  return {
    id,
    user: overrides.user ?? createMockUser(),
    hash:
      overrides.hash ??
      `session-hash-64-chars-0123456789abcdef0123456789abcdef01234567-${sessionIdCounter}`,
    browser: 'browser' in overrides ? overrides.browser : 'Chrome',
    browserVersion:
      'browserVersion' in overrides ? overrides.browserVersion : '120.0.0',
    os: 'os' in overrides ? overrides.os : 'macOS',
    osVersion: 'osVersion' in overrides ? overrides.osVersion : '14.0',
    deviceType: overrides.deviceType ?? DeviceType.DESKTOP,
    ipAddress: 'ipAddress' in overrides ? overrides.ipAddress : '127.0.0.1',
    userAgent:
      'userAgent' in overrides
        ? overrides.userAgent
        : 'Mozilla/5.0 Test User Agent',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: 'deletedAt' in overrides ? overrides.deletedAt : null,
  } as Session;
};

export const createExpiredSession = (
  overrides: Partial<Session> = {},
): Session => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 30);

  return createMockSession({
    createdAt: pastDate,
    updatedAt: pastDate,
    ...overrides,
  });
};

export const createDeletedSession = (
  overrides: Partial<Session> = {},
): Session => {
  return createMockSession({
    deletedAt: new Date(),
    ...overrides,
  });
};
