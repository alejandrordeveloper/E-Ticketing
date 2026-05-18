import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { CoreProxyService } from './core-proxy.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OrdersController } from './orders.controller';

describe('Orders gateway slice', () => {
  let ordersController: OrdersController;
  let jwtAuthGuard: JwtAuthGuard;

  const proxyServiceMock = {
    post: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string, fallback?: string | number) => {
      if (key === 'JWT_SECRET') {
        return 'gateway-secret';
      }

      return fallback;
    }),
    getOrThrow: jest.fn().mockReturnValue('http://localhost:3001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
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

    ordersController = module.get<OrdersController>(OrdersController);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    proxyServiceMock.post.mockReset();
  });

  it('forwards protected order creation with authorization header', async () => {
    const payload = { eventId: 'event-1', userId: 'user-1', quantity: 1 };
    const createdOrder = { id: 'order-1', ...payload, status: 'confirmed' };

    proxyServiceMock.post.mockResolvedValue(createdOrder);

    await expect(
      ordersController.create(payload, 'Bearer token-value'),
    ).resolves.toEqual(createdOrder);
    expect(proxyServiceMock.post).toHaveBeenCalledWith(
      'http://localhost:3001/orders',
      payload,
      {
        headers: { Authorization: 'Bearer token-value' },
      },
    );
  });

  it('rejects requests without a bearer token', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    expect(() => jwtAuthGuard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('accepts requests with a valid bearer token', () => {
    const token = sign({ sub: 'user-1' }, 'gateway-secret');
    const request = {
      headers: { authorization: `Bearer ${token}` },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    expect(jwtAuthGuard.canActivate(context)).toBe(true);
    expect(request).toHaveProperty('user');
  });
});