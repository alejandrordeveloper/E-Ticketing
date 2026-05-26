import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { StructuredLogger } from './common/structured-logger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new StructuredLogger('api-gateway');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Listening on port ${process.env.PORT ?? 3000}`, 'Bootstrap');
}
bootstrap();
