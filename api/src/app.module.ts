import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './mail/mail.module';
import { MediaModule } from './modules/media/media.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StorageModule } from './storage/storage.module';
import { AnimesModule } from './modules/animes/animes.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { GenresModule } from './modules/genres/genres.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    StorageModule,
    MediaModule,
    MailModule,
    RbacModule,
    UsersModule,
    SessionsModule,
    AuthModule,
    AnimesModule,
    GenresModule,
    ContributionsModule,
  ],
})
export class AppModule {}
