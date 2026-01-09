import type { MailProvider } from '../../src/mail/providers/mail-provider.interface';

export const createMockMailProvider = (): jest.Mocked<MailProvider> => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  verify: jest.fn().mockResolvedValue(true),
});
