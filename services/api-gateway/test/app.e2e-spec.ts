import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { EventsController } from './../src/events.controller';
import { OrdersController } from './../src/orders.controller';
import { CoreProxyService } from './../src/core-proxy.service';
import { JwtAuthGuard } from './../src/jwt-auth.guard';

describe('Gateway core routes (e2e)', () => {
  let app: INestApplication<App>;

  const proxyServiceMock = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string, fallback?: string | number) => {
      if (key === 'JWT_SECRET') {
        return 'gateway-secret';
      }

      return fallback;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'EVENTS_SERVICE_URL') {
        return 'http://localhost:3002';
      }

      if (key === 'ORDERS_SERVICE_URL') {
        return 'http://localhost:3001';
      }

      throw new Error(`Unknown key ${key}`);
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController, OrdersController],
      providers: [
        JwtAuthGuard,
        {
          provide: CoreProxyService,
          useValue: proxyServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    proxyServiceMock.get.mockReset();
    proxyServiceMock.post.mockReset();
  });

  it('/events (GET)', async () => {
    const events = [{ id: 'event-1', name: 'Festival' }];
    proxyServiceMock.get.mockResolvedValue(events);

    await request(app.getHttpServer()).get('/events').expect(200).expect(events);
  });

  it('/orders (POST) rejects missing token', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .send({ eventId: 'event-1', userId: 'user-1', quantity: 1 })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
