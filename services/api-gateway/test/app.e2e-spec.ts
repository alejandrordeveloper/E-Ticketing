import { HttpService } from '@nestjs/axios';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import request from 'supertest';
import { App } from 'supertest/types';
import { of } from 'rxjs';
import { AuthController } from './../src/auth.controller';
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

  const httpServiceMock = {
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
      controllers: [AuthController, EventsController, OrdersController],
      providers: [
        JwtAuthGuard,
        {
          provide: CoreProxyService,
          useValue: proxyServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    proxyServiceMock.get.mockReset();
    proxyServiceMock.post.mockReset();
    httpServiceMock.post.mockReset();
    process.env.AUTH_SERVICE_URL = 'http://localhost:8000';
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
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing Bearer token',
          path: '/orders',
          service: 'api-gateway',
        });
        expect(body.timestamp).toEqual(expect.any(String));
      });
  });

  it('/events (GET) normalizes upstream failures', async () => {
    proxyServiceMock.get.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 503',
      response: {
        status: 503,
        data: {
          error: 'Events Service Unavailable',
          message: 'Events catalog temporarily unavailable',
          details: { retryAfter: 30 },
        },
      },
    });

    await request(app.getHttpServer())
      .get('/events')
      .expect(503)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 503,
          error: 'Events Service Unavailable',
          message: 'Events catalog temporarily unavailable',
          path: '/events',
          service: 'api-gateway',
          details: { retryAfter: 30 },
        });
        expect(body.timestamp).toEqual(expect.any(String));
      });
  });

  it('/auth/register rejects malformed payloads', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'ab',
        email: 'not-an-email',
        password: '123',
        extraField: true,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          path: '/auth/register',
          service: 'api-gateway',
        });
        expect(body.details).toEqual(
          expect.arrayContaining([
            expect.stringContaining('username'),
            expect.stringContaining('email'),
            expect.stringContaining('password'),
            expect.stringContaining('extraField'),
          ]),
        );
      });

    expect(httpServiceMock.post).not.toHaveBeenCalled();
  });

  it('/auth/login forwards sanitized payloads', async () => {
    httpServiceMock.post.mockReturnValue(
      of({
        data: {
          access: 'token',
          refresh: 'refresh-token',
        },
      }),
    );

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: '  USER@EMAIL.COM  ',
        password: 'testpassword123',
      })
      .expect(201)
      .expect({
        access: 'token',
        refresh: 'refresh-token',
      });

    expect(httpServiceMock.post).toHaveBeenCalledWith('http://localhost:8000/login/', {
      email: 'user@email.com',
      password: 'testpassword123',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
