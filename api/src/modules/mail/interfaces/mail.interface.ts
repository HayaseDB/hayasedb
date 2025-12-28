export interface SendEmailOptions {
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

export interface EmailUser {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginMetadata {
  timestamp: Date;
  device: string;
  location: string;
  ipAddress: string;
  browser: string;
}
