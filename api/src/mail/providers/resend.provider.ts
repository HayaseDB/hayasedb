import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { CreateEmailOptions } from 'resend';

import type { MailProvider, SendMailOptions } from './mail-provider.interface';

export interface ResendConfig {
  apiKey: string;
  from: {
    name: string;
    address: string;
  };
}

export class ResendMailProvider implements MailProvider {
  private readonly logger = new Logger(ResendMailProvider.name);
  private client: Resend;

  constructor(private readonly config: ResendConfig) {
    this.client = new Resend(this.config.apiKey);
    this.logger.log('Resend provider initialized');
  }

  private getFromAddress(options: SendMailOptions): string {
    if (options.from) {
      return `${options.from.name ?? this.config.from.name} <${options.from.email}>`;
    }
    return `${this.config.from.name} <${this.config.from.address}>`;
  }

  async sendEmail(options: SendMailOptions): Promise<void> {
    if (!options.html && !options.text) {
      throw new Error('Email must contain either html or text content');
    }

    const emailPayload: CreateEmailOptions = {
      from: this.getFromAddress(options),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      ...(options.html ? { html: options.html } : { text: options.text! }),
    };

    if (options.replyTo) {
      emailPayload.replyTo = options.replyTo;
    }

    const { data, error } = await this.client.emails.send(emailPayload);

    if (error) {
      throw new Error(error.message);
    }

    this.logger.log(
      `Email sent successfully via Resend: ${data?.id ?? 'unknown'}`,
    );
  }

  async verify(): Promise<boolean> {
    try {
      await this.client.domains.list();
      this.logger.log('Resend API key verified successfully');
      return true;
    } catch (error) {
      this.logger.warn(
        'Resend API key verification failed (this is optional)',
        error,
      );
      return false;
    }
  }
}
