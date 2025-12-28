export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: {
    name?: string;
    email: string;
  };
  replyTo?: string;
}

export interface MailProvider {
  sendEmail(options: SendMailOptions): Promise<void>;
  verify?(): Promise<boolean>;
}
