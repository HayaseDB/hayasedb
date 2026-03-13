import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import helmet from 'helmet';
import { dump as yamlDump } from 'js-yaml';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.API_WEB_URL || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.API_PORT ?? 3000;

  if (process.env.API_SWAGGER_ENABLED !== 'false') {
    const swaggerPath = process.env.API_SWAGGER_PATH || 'docs';
    const config = new DocumentBuilder()
      .setTitle('HayaseDB API')
      .setDescription('HayaseDB API Documentation')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);

    app.use(`/${swaggerPath}.json`, (_req: Request, res: Response) => {
      res.json(document);
    });

    app.use(`/${swaggerPath}.yaml`, (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/yaml');
      res.send(yamlDump(document));
    });

    app.use(
      `/${swaggerPath}`,
      apiReference({
        theme: 'purple',
        layout: 'modern',
        metaData: {
          title: 'HayaseDB API',
          description: 'HayaseDB API Documentation',
        },
        hideClientButton: true,
        showSidebar: true,
        operationTitleSource: 'summary',
        persistAuth: true,
        isEditable: true,
        hideModels: true,
        hideDarkModeToggle: false,
        documentDownloadType: 'both',
        hideTestRequestButton: false,
        hideSearch: false,
        withDefaultFonts: true,
        defaultOpenAllTags: false,
        content: document,
      }),
    );

    Logger.log(
      `API documentation available at: http://localhost:${port}/${swaggerPath}`,
      'Bootstrap',
    );
  }

  await app.listen(port, '0.0.0.0');

  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

void bootstrap();
