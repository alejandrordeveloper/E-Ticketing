import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { OrdersController } from './../src/orders/orders.controller';
import { OrdersService } from './../src/orders/orders.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication<App>;

  const ordersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    upsertStock: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    ordersServiceMock.create.mockReset();
    ordersServiceMock.findAll.mockReset();
    ordersServiceMock.upsertStock.mockReset();
  });

  it('/orders/stock (POST)', async () => {
    const payload = {
      eventId: 'event-1',
      initialInventory: 5,
    };

    const stock = {
      id: 'stock-1',
      eventId: 'event-1',
      initialInventory: 5,
      available: 5,
    };

    ordersServiceMock.upsertStock.mockResolvedValue(stock);

    await request(app.getHttpServer())
      .post('/orders/stock')
      .send(payload)
      .expect(201)
      .expect(stock);
  });

  it('/orders (GET)', async () => {
    const orders = [
      {
        id: 'order-1',
        eventId: 'event-1',
        userId: 'user-1',
        quantity: 1,
        status: 'confirmed',
      },
    ];

    ordersServiceMock.findAll.mockResolvedValue(orders);

    await request(app.getHttpServer()).get('/orders').expect(200).expect(orders);
  });

  it('/orders (POST)', async () => {
    const payload = {
      eventId: 'event-2',
      userId: 'user-2',
      quantity: 2,
    };

    const createdOrder = {
      id: 'order-2',
      ...payload,
      status: 'confirmed',
    };

    ordersServiceMock.create.mockResolvedValue(createdOrder);

    await request(app.getHttpServer())
      .post('/orders')
      .send(payload)
      .expect(201)
      .expect(createdOrder);
  });

  afterEach(async () => {
    await app.close();
  });
});
