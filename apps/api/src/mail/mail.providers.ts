import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type MailConfig, type Mailer, createMailer } from '@hayasedb/mail'
import type { Env } from '../config/env.schema'
import { MAILER } from './mail.constants'

function buildMailConfig(config: ConfigService<Env, true>): MailConfig {
  const from = config.get('MAIL_FROM', { infer: true })
  const driver = config.get('MAIL_DRIVER', { infer: true })

  if (driver === 'resend') {
    return {
      driver: 'resend',
      from,
      resendApiKey: config.get('MAIL_RESEND_API_KEY', { infer: true }),
    }
  }

  return {
    driver: 'smtp',
    from,
    smtp: {
      host: config.get('MAIL_SMTP_HOST', { infer: true }),
      port: config.get('MAIL_SMTP_PORT', { infer: true }),
      secure: config.get('MAIL_SMTP_SECURE', { infer: true }),
      user: config.get('MAIL_SMTP_USER', { infer: true }),
      pass: config.get('MAIL_SMTP_PASS', { infer: true }),
    },
  }
}

export const mailProvider: Provider = {
  provide: MAILER,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Mailer =>
    createMailer(buildMailConfig(config)),
}

@Injectable()
export class MailLifecycle implements OnApplicationShutdown {
  constructor(@Inject(MAILER) private readonly mailer: Mailer) {}

  async onApplicationShutdown(): Promise<void> {
    await this.mailer.close()
  }
}
