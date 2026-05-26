import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { StructuredLogger } from './common/structured-logger';
import { AppModule } from './app.module';

export async function bootstrap() {
  const logger = new StructuredLogger('orders-service');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-ticket Orders Service')
    .setDescription('Reservations and order management service.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Listening on port ${process.env.PORT ?? 3000}`, 'Bootstrap');
}

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
