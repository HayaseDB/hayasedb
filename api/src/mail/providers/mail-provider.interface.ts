import type { SendEmailOptions } from '../interfaces/mail.interface';

export interface MailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
  verify?(): Promise<boolean>;
}
