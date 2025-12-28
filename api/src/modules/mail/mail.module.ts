import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig, Environment } from '../../config/app.config';
import { MailService } from './mail.service';

@Global()
@Module({
  providers: [MailService],
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
    const isDevelopment = appConfig?.API_ENV === Environment.Development;

    if (isDevelopment) {
      this.logger.warn(
        'Mail connection verification skipped in development mode',
      );
      return;
    }

    await this.mailService
      .verifyConnection()
      .then(() => this.logger.log('Mail module initialized successfully'))
      .catch(() => this.logger.warn('Mail connection verification failed'));
  }
}
