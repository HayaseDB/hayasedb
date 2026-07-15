import { Global, Module } from '@nestjs/common'
import { MAILER } from './mail.constants'
import { MailLifecycle, mailProvider } from './mail.providers'

@Global()
@Module({
  providers: [mailProvider, MailLifecycle],
  exports: [MAILER],
})
export class MailModule {}
