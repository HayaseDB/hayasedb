import { resolve } from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { validate } from './env.schema'

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? []
          : resolve(process.cwd(), '../../.env'),
    }),
  ],
})
export class ConfigModule {}
