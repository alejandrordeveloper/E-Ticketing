
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20, // 20 requests por minuto por IP
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
