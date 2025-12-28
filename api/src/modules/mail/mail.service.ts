import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { ReactElement } from 'react';
import { createElement } from 'react';

import { AppConfig } from '../../config/app.config';
import { MailConfig } from '../../config/mail.config';
import {
  EmailUser,
  LoginMetadata,
  SendEmailOptions,
} from './interfaces/mail.interface';
import { LoginNotificationEmail } from './templates/LoginNotificationEmail';
import { VerificationEmail } from './templates/VerificationEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly mailConfig: MailConfig;
  private readonly appConfig: AppConfig;

  constructor(private readonly configService: ConfigService) {
    this.mailConfig = this.configService.getOrThrow<MailConfig>('mail');
    this.appConfig = this.configService.getOrThrow<AppConfig>('app');

    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.API_MAIL_HOST,
      port: this.mailConfig.API_MAIL_PORT,
      secure: this.mailConfig.API_MAIL_SECURE,
      auth:
        this.mailConfig.API_MAIL_USER && this.mailConfig.API_MAIL_PASSWORD
          ? {
              user: this.mailConfig.API_MAIL_USER,
              pass: this.mailConfig.API_MAIL_PASSWORD,
            }
          : undefined,
    });

    this.logger.log('Mail service initialized');
  }

  private getFromAddress(): string {
    return `"${this.mailConfig.API_MAIL_FROM_NAME}" <${this.mailConfig.API_MAIL_FROM_ADDRESS}>`;
  }

  private getUserName(user: EmailUser): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email.split('@')[0];
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const from = options.from
      ? `"${options.from.name ?? this.mailConfig.API_MAIL_FROM_NAME}" <${options.from.email}>`
      : this.getFromAddress();

    await this.transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    const recipients = Array.isArray(options.to)
      ? options.to.join(', ')
      : options.to;
    this.logger.log(`Email sent successfully to ${recipients}`);
  }

  async verifyConnection(): Promise<void> {
    await this.transporter.verify();
    this.logger.log('Mail connection verified successfully');
  }

  private async renderTemplate(
    component: ReactElement,
  ): Promise<{ html: string; text: string }> {
    const html = await render(component);
    const text = await render(component, { plainText: true });
    return { html, text };
  }

  async sendWelcomeEmail(user: EmailUser): Promise<void> {
    const userName = this.getUserName(user);

    const { html, text } = await this.renderTemplate(
      createElement(WelcomeEmail, {
        appName: this.mailConfig.API_MAIL_FROM_NAME,
        userName,
      }),
    );

    await this.sendEmail({
      to: user.email,
      subject: `Welcome to ${this.mailConfig.API_MAIL_FROM_NAME}!`,
      html,
      text,
    });
  }

  async sendLoginNotificationEmail(
    user: EmailUser,
    metadata: LoginMetadata,
  ): Promise<void> {
    const userName = this.getUserName(user);
    const formattedTime = metadata.timestamp.toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const { html, text } = await this.renderTemplate(
      createElement(LoginNotificationEmail, {
        appName: this.mailConfig.API_MAIL_FROM_NAME,
        userName,
        loginDetails: {
          time: formattedTime,
          device: metadata.device,
          browser: metadata.browser,
          location: metadata.location,
          ipAddress: metadata.ipAddress,
        },
      }),
    );

    await this.sendEmail({
      to: user.email,
      subject: `New Login to Your ${this.mailConfig.API_MAIL_FROM_NAME} Account`,
      html,
      text,
    });
  }

  async sendVerificationEmail(
    user: EmailUser,
    verificationToken: string,
  ): Promise<void> {
    const userName = this.getUserName(user);
    const baseUrl = this.appConfig.API_WEB_URL || 'http://localhost:5173';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    const { html, text } = await this.renderTemplate(
      createElement(VerificationEmail, {
        appName: this.mailConfig.API_MAIL_FROM_NAME,
        userName,
        verificationUrl,
        expiresIn: '24 hours',
      }),
    );

    await this.sendEmail({
      to: user.email,
      subject: `Verify your email for ${this.mailConfig.API_MAIL_FROM_NAME}`,
      html,
      text,
    });
  }
}
