import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Order } from './entities/order.entity';

@Injectable()
export class OrderEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(OrderEventsPublisher.name);
  private readonly redisClient: Redis;
  private readonly orderConfirmedChannel: string;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    this.orderConfirmedChannel = this.configService.get<string>(
      'REDIS_ORDER_CONFIRMED_CHANNEL',
      'ORDER_CONFIRMED',
    );
  }

  async publishOrderConfirmed(order: Order): Promise<void> {
    const payload = {
      orderId: order.id,
      eventId: order.eventId,
      userId: order.userId,
      quantity: order.quantity,
      status: order.status,
      createdAt: order.createdAt,
    };

    try {
      if (this.redisClient.status === 'wait') {
        await this.redisClient.connect();
      }

      await this.redisClient.publish(this.orderConfirmedChannel, JSON.stringify(payload));
    } catch (error) {
      this.logger.error('Failed to publish ORDER_CONFIRMED event', error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient.status !== 'end') {
      await this.redisClient.quit();
    }
  }
}