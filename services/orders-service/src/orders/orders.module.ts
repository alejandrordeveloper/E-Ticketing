import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStock } from './entities/event-stock.entity';
import { Order } from './entities/order.entity';
import { OrderEventsPublisher } from './order-events.publisher';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Order, EventStock])],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsPublisher],
  exports: [OrdersService],
})
export class OrdersModule {}