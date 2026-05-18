import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CoreProxyService } from './core-proxy.service';
import { EventsController } from './events.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
      ttl: 60000, // 60 segundos
      limit: 20, // 20 requests por minuto por IP
    }
    ]),
    HttpModule,
  ],
  controllers: [AppController, AuthController, EventsController, OrdersController],
  providers: [
    AppService,
    CoreProxyService,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
