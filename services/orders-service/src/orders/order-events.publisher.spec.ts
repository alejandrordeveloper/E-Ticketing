jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'wait',
    connect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { OrderEventsPublisher } from './order-events.publisher';

describe('OrderEventsPublisher', () => {
  const configServiceMock = {
    get: jest.fn((key: string, fallback: string | number) => fallback),
  } as unknown as ConfigService;

  it('publishes ORDER_CONFIRMED payloads', async () => {
    const publisher = new OrderEventsPublisher(configServiceMock);
    const redisClient = (Redis as unknown as jest.Mock).mock.results[0].value;

    await publisher.publishOrderConfirmed({
      id: 'order-1',
      eventId: 'event-1',
      userId: 'user-1',
      quantity: 1,
      status: 'confirmed',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never);

    expect(redisClient.connect).toHaveBeenCalled();
    expect(redisClient.publish).toHaveBeenCalled();
  });

  it('closes the redis connection on destroy', async () => {
    const publisher = new OrderEventsPublisher(configServiceMock);
    const redisClient = (Redis as unknown as jest.Mock).mock.results[1].value;
    redisClient.status = 'ready';

    await publisher.onModuleDestroy();

    expect(redisClient.quit).toHaveBeenCalled();
  });
});