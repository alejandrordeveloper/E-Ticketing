import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { StructuredLogger } from './common/structured-logger';
import { AppModule } from './app.module';

async function bootstrap() {
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
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Listening on port ${process.env.PORT ?? 3000}`, 'Bootstrap');
}
bootstrap();
