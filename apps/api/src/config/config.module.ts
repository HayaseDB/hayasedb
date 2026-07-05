import { Global, Module, type Provider } from '@nestjs/common'
import { loadEnv } from '@hayasedb/config/env'
import { APP_CONFIG } from './config.constants'

const configProvider: Provider = {
  provide: APP_CONFIG,
  useFactory: () => loadEnv(),
}

@Global()
@Module({
  providers: [configProvider],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
