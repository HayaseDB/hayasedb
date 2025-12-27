import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { useContainer } from 'class-validator';

import { AppModule } from './app.module';
import type { AppConfig } from './config/app.config';
import type { SwaggerConfig } from './config/swagger.config';

import * as packageJson from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');

  if (appConfig.API_CORS_ORIGIN) {
    app.enableCors({
      origin: appConfig.API_CORS_ORIGIN,
      credentials: true,
    });
  }

  const swaggerConfig = configService.getOrThrow<SwaggerConfig>('swagger');

  if (swaggerConfig.API_SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('HayaseDB API')
      .setVersion(packageJson.version)
      .addBearerAuth(
        {
          description: 'Used for refreshing the access_token',
          name: 'refresh_token',
          type: 'http',
        },
        'refresh_token',
      )
      .addBearerAuth(
        {
          description: 'Used to access as user',
          name: 'access_token',
          type: 'http',
        },
        'access_token',
      )
      .setLicense('MIT', 'https://github.com/hayasedb/hayasedb')
      .setContact('Sebastian Stepper', '', 'sebastian-stepper@gmx.de')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
      `/${swaggerConfig.API_SWAGGER_PATH}`,
      apiReference({
        theme: 'purple',
        layout: 'modern',
        metaData: {
          title: 'HayaseDB API',
          description: `${'HayaseDB API'} Documentation`,
        },
        hideClientButton: true,
        showSidebar: true,
        operationTitleSource: 'summary',
        persistAuth: true,
        isEditable: true,
        isLoading: true,
        hideModels: true,
        documentDownloadType: 'both',
        hideTestRequestButton: false,
        hideSearch: false,
        showOperationId: false,
        hideDarkModeToggle: false,
        withDefaultFonts: true,
        defaultOpenAllTags: false,
        expandAllModelSections: false,
        expandAllResponses: false,
        orderSchemaPropertiesBy: 'alpha',
        orderRequiredPropertiesFirst: true,
        content: document,
      }),
    );

    Logger.log(
      `API documentation available at: http://localhost:${appConfig.API_PORT}/${swaggerConfig.API_SWAGGER_PATH}`,
      'Bootstrap',
    );
  }

  const port = appConfig.API_PORT;

  Logger.log(`Starting HayaseDB API on port ${port}`, 'Bootstrap');
  Logger.log(`Version: ${packageJson.version}`, 'Bootstrap');
  Logger.log(`Environment: ${appConfig.API_ENV}`, 'Bootstrap');

  await app.listen(port, '0.0.0.0');

  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
