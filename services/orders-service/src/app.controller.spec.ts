import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';

describe('OrdersController', () => {
  let ordersController: OrdersController;

  const ordersServiceMock = {
    findAll: jest.fn(),
    upsertStock: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersServiceMock,
        },
      ],
    }).compile();

    ordersController = app.get<OrdersController>(OrdersController);
    ordersServiceMock.findAll.mockReset();
    ordersServiceMock.upsertStock.mockReset();
  });

  it('creates stock for an event', async () => {
    const stock = {
      id: 'stock-1',
      eventId: 'event-1',
      initialInventory: 10,
      available: 10,
    };

    ordersServiceMock.upsertStock.mockResolvedValue(stock);

    await expect(
      ordersController.upsertStock({ eventId: 'event-1', initialInventory: 10 }),
    ).resolves.toEqual(stock);
    expect(ordersServiceMock.upsertStock).toHaveBeenCalledTimes(1);
  });

  it('returns the list of orders', async () => {
    const orders = [
      {
        id: 'order-1',
        eventId: 'event-1',
        userId: 'user-1',
        quantity: 2,
        status: 'confirmed',
      },
    ];

    ordersServiceMock.findAll.mockResolvedValue(orders);

    await expect(ordersController.findAll()).resolves.toEqual(orders);
    expect(ordersServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
