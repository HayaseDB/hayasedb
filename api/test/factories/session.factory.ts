import { Session } from '../../src/modules/sessions/entities/session.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { createMockUser } from './user.factory';

let sessionIdCounter = 0;

export function createMockSession(
  overrides: Partial<Session> & { user?: User } = {},
): Session {
  sessionIdCounter++;
  const session = new Session();
  session.id = overrides.id ?? `session-uuid-${sessionIdCounter}`;
  session.user = overrides.user ?? createMockUser();
  session.hash = overrides.hash ?? `session-hash-${sessionIdCounter}`;
  session.createdAt = overrides.createdAt ?? new Date();
  session.updatedAt = overrides.updatedAt ?? new Date();
  session.deletedAt = overrides.deletedAt ?? null;
  return session;
}

export function resetSessionFactory(): void {
  sessionIdCounter = 0;
}
