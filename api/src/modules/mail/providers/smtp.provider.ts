import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import type { MailProvider, SendMailOptions } from './mail-provider.interface';

export interface SmtpConfig {
  host?: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    address: string;
  };
}

export class SmtpMailProvider implements MailProvider {
  private readonly logger = new Logger(SmtpMailProvider.name);
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    this.logger.log('SMTP provider initialized');
  }

  private getFromAddress(options: SendMailOptions): string {
    if (options.from) {
      return `"${options.from.name ?? this.config.from.name}" <${options.from.email}>`;
    }
    return `"${this.config.from.name}" <${this.config.from.address}>`;
  }

  async sendEmail(options: SendMailOptions): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.getFromAddress(options),
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    this.logger.log(`Email sent successfully: ${info.messageId ?? 'unknown'}`);
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection verification failed', error);
      return false;
    }
  }
}
