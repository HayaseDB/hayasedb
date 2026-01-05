import { User } from '../../src/modules/users/entities/user.entity';
import { Role } from '../../src/modules/rbac/enums/role.enum';

let userIdCounter = 0;

export function createMockUser(overrides: Partial<User> = {}): User {
  userIdCounter++;
  const user = new User();
  user.id = overrides.id ?? `user-uuid-${userIdCounter}`;
  user.username = overrides.username ?? `testuser${userIdCounter}`;
  user.email = overrides.email ?? `test${userIdCounter}@example.com`;
  user.password = overrides.password ?? '$2b$10$hashedpassword';
  user.firstName = overrides.firstName ?? 'Test';
  user.lastName = overrides.lastName ?? 'User';
  user.role = overrides.role ?? Role.USER;
  user.emailVerifiedAt =
    'emailVerifiedAt' in overrides ? overrides.emailVerifiedAt! : new Date();
  user.emailVerificationToken = overrides.emailVerificationToken ?? null;
  user.emailVerificationExpiresAt =
    overrides.emailVerificationExpiresAt ?? null;
  user.createdAt = overrides.createdAt ?? new Date();
  user.updatedAt = overrides.updatedAt ?? new Date();
  user.deletedAt = overrides.deletedAt ?? null;
  return user;
}

export function createUnverifiedUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    emailVerifiedAt: null,
    emailVerificationToken: 'verification-token-123',
    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ...overrides,
  });
}

export function resetUserFactory(): void {
  userIdCounter = 0;
}
