import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig, Environment } from '../../config/app.config';
import { MailConfig } from '../../config/mail.config';
import {
  MAIL_PROVIDER_TOKEN,
  MailProviderType,
} from './constants/mail.constants';
import { MailService } from './mail.service';
import type { MailProvider } from './providers/mail-provider.interface';
import { ResendMailProvider } from './providers/resend.provider';
import { SmtpMailProvider } from './providers/smtp.provider';

export function createMailProvider(configService: ConfigService): MailProvider {
  const logger = new Logger('MailProviderFactory');
  const mailConfig = configService.getOrThrow<MailConfig>('mail');

  logger.log(`Initializing mail provider: ${mailConfig.API_MAIL_PROVIDER}`);

  switch (mailConfig.API_MAIL_PROVIDER) {
    case MailProviderType.SMTP: {
      return new SmtpMailProvider({
        host: mailConfig.API_SMTP_HOST,
        port: mailConfig.API_SMTP_PORT,
        secure: mailConfig.API_SMTP_SECURE,
        auth:
          mailConfig.API_SMTP_USER && mailConfig.API_SMTP_PASS
            ? { user: mailConfig.API_SMTP_USER, pass: mailConfig.API_SMTP_PASS }
            : undefined,
        from: {
          name: mailConfig.API_MAIL_FROM_NAME,
          address: mailConfig.API_MAIL_FROM_ADDRESS,
        },
      });
    }

    case MailProviderType.RESEND: {
      if (!mailConfig.API_RESEND_API_KEY) {
        throw new Error(
          'Resend API key is required when using Resend provider. Set API_RESEND_API_KEY environment variable.',
        );
      }

      return new ResendMailProvider({
        apiKey: mailConfig.API_RESEND_API_KEY,
        from: {
          name: mailConfig.API_MAIL_FROM_NAME,
          address: mailConfig.API_MAIL_FROM_ADDRESS,
        },
      });
    }

    default: {
      const unknownProvider: never = mailConfig.API_MAIL_PROVIDER;
      throw new Error(
        `Unknown mail provider: ${String(unknownProvider)}. Valid options are: ${Object.values(MailProviderType).join(', ')}`,
      );
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MAIL_PROVIDER_TOKEN,
      useFactory: createMailProvider,
      inject: [ConfigService],
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule implements OnModuleInit {
  private readonly logger = new Logger(MailModule.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    const appConfig = this.configService.get<AppConfig>('app');
    const mailConfig = this.configService.get<MailConfig>('mail');
    const isDevelopment = appConfig?.API_ENV === Environment.Development;

    if (isDevelopment || !mailConfig?.API_MAIL_VERIFY_CONNECTION) {
      this.logger.warn('Mail connection verification skipped');
      return;
    }

    const verified = await this.mailService.verifyConnection();
    if (verified) {
      this.logger.log('Mail module initialized successfully');
    } else {
      this.logger.warn('Mail connection verification failed');
    }
  }
}
