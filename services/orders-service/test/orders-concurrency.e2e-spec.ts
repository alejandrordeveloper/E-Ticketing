import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { EventStock } from './../src/orders/entities/event-stock.entity';
import { Order } from './../src/orders/entities/order.entity';

describe('Orders concurrency (e2e)', () => {
  let app: INestApplication<App>;
  let orderRepository: Repository<Order>;
  let stockRepository: Repository<EventStock>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    orderRepository = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));
    stockRepository = moduleFixture.get<Repository<EventStock>>(
      getRepositoryToken(EventStock),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows only one successful purchase for the last available ticket', async () => {
    const eventId = `event-${randomUUID()}`;

    await orderRepository.delete({ eventId });
    await stockRepository.delete({ eventId });

    await request(app.getHttpServer())
      .post('/orders/stock')
      .send({
        eventId,
        initialInventory: 1,
      })
      .expect(201);

    const purchaseA = request(app.getHttpServer()).post('/orders').send({
      eventId,
      userId: 'user-a',
      quantity: 1,
    });

    const purchaseB = request(app.getHttpServer()).post('/orders').send({
      eventId,
      userId: 'user-b',
      quantity: 1,
    });

    const [responseA, responseB] = await Promise.all([purchaseA, purchaseB]);
    const statusCodes = [responseA.status, responseB.status].sort((left, right) => left - right);

    expect(statusCodes).toEqual([201, 409]);

    const persistedOrders = await orderRepository.find({ where: { eventId } });
    const persistedStock = await stockRepository.findOne({ where: { eventId } });

    expect(persistedOrders).toHaveLength(1);
    expect(persistedStock).not.toBeNull();
    expect(persistedStock?.available).toBe(0);

    await orderRepository.delete({ eventId });
    await stockRepository.delete({ eventId });
  });
});