import { User } from '../../src/modules/users/entities/user.entity';
import { Role } from '../../src/modules/rbac/enums/role.enum';

let userIdCounter = 0;

export const resetUserFactory = (): void => {
  userIdCounter = 0;
};

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const id = overrides.id ?? `user-${++userIdCounter}`;
  const now = new Date();
  const emailVerifiedAt =
    'emailVerifiedAt' in overrides ? overrides.emailVerifiedAt : now;

  return {
    id,
    username: overrides.username ?? `testuser${userIdCounter}`,
    email: overrides.email ?? `test${userIdCounter}@example.com`,
    password: overrides.password ?? '$2b$10$hashedpassword',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    role: overrides.role ?? Role.USER,
    profilePicture:
      'profilePicture' in overrides ? overrides.profilePicture : null,
    emailVerifiedAt,
    emailVerificationToken:
      'emailVerificationToken' in overrides
        ? overrides.emailVerificationToken
        : null,
    emailVerificationExpiresAt:
      'emailVerificationExpiresAt' in overrides
        ? overrides.emailVerificationExpiresAt
        : null,
    passwordResetToken:
      'passwordResetToken' in overrides ? overrides.passwordResetToken : null,
    passwordResetExpiresAt:
      'passwordResetExpiresAt' in overrides
        ? overrides.passwordResetExpiresAt
        : null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: 'deletedAt' in overrides ? overrides.deletedAt : null,
    get isEmailVerified(): boolean {
      return emailVerifiedAt !== null;
    },
  } as User;
};

export const createUnverifiedUser = (overrides: Partial<User> = {}): User => {
  const futureExpiry = new Date();
  futureExpiry.setHours(futureExpiry.getHours() + 24);

  return createMockUser({
    emailVerifiedAt: null,
    emailVerificationToken:
      'verification-token-64-chars-long-0123456789abcdef0123456789abcdef',
    emailVerificationExpiresAt: futureExpiry,
    ...overrides,
  });
};

export const createAdminUser = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    role: Role.ADMINISTRATOR,
    ...overrides,
  });
};

export const createUserWithPasswordReset = (
  overrides: Partial<User> = {},
): User => {
  const futureExpiry = new Date();
  futureExpiry.setHours(futureExpiry.getHours() + 1);

  return createMockUser({
    passwordResetToken:
      'password-reset-token-64-chars-0123456789abcdef0123456789abcdef',
    passwordResetExpiresAt: futureExpiry,
    ...overrides,
  });
};
