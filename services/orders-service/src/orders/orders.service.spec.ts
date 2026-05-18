import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CreateStockDto } from './dto/create-stock.dto';
import { EventStock } from './entities/event-stock.entity';
import { Order } from './entities/order.entity';
import { OrderEventsPublisher } from './order-events.publisher';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let ordersService: OrdersService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as Partial<Repository<Order>>;

  const stockRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  } as Partial<Repository<EventStock>>;

  const dataSourceMock = {
    transaction: jest.fn(),
  };

  const orderEventsPublisherMock = {
    publishOrderConfirmed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: OrderEventsPublisher,
          useValue: orderEventsPublisherMock,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(EventStock),
          useValue: stockRepositoryMock,
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    repositoryMock.create = jest.fn();
    repositoryMock.save = jest.fn();
    repositoryMock.find = jest.fn();
    stockRepositoryMock.create = jest.fn();
    stockRepositoryMock.save = jest.fn();
    stockRepositoryMock.findOne = jest.fn();
    dataSourceMock.transaction.mockReset();
    orderEventsPublisherMock.publishOrderConfirmed.mockReset();
  });

  it('creates stock for a new event', async () => {
    const payload: CreateStockDto = {
      eventId: 'event-1',
      initialInventory: 10,
    };

    const stock = {
      id: 'stock-1',
      eventId: 'event-1',
      initialInventory: 10,
      available: 10,
    };

    (stockRepositoryMock.findOne as jest.Mock).mockResolvedValue(null);
    (stockRepositoryMock.create as jest.Mock).mockReturnValue(stock);
    (stockRepositoryMock.save as jest.Mock).mockResolvedValue(stock);

    await expect(ordersService.upsertStock(payload)).resolves.toEqual(stock);
    expect(stockRepositoryMock.create).toHaveBeenCalledWith({
      eventId: 'event-1',
      initialInventory: 10,
      available: 10,
    });
  });

  it('creates an order after locking and discounting stock', async () => {
    const payload = {
      eventId: 'event-1',
      userId: 'user-1',
      quantity: 1,
    };

    const createdOrder = {
      id: 'order-1',
      ...payload,
      status: 'confirmed',
    };

    const lockedStock = {
      id: 'stock-1',
      eventId: 'event-1',
      initialInventory: 5,
      available: 2,
    };

    const manager = {
      findOne: jest.fn().mockResolvedValue(lockedStock),
      save: jest.fn().mockImplementation((entity, data) => Promise.resolve(data)),
      create: jest.fn().mockReturnValue(createdOrder),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(ordersService.create(payload)).resolves.toEqual(createdOrder);
    expect(manager.findOne).toHaveBeenCalledWith(EventStock, {
      where: { eventId: 'event-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(EventStock, {
      ...lockedStock,
      available: 1,
    });
    expect(manager.create).toHaveBeenCalledWith(Order, {
      ...payload,
      status: 'confirmed',
    });
    expect(orderEventsPublisherMock.publishOrderConfirmed).toHaveBeenCalledWith(
      createdOrder,
    );
  });

  it('rejects an order when stock does not exist', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(
      ordersService.create({
        eventId: 'missing-event',
        userId: 'user-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an order when inventory is insufficient', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({
        id: 'stock-1',
        eventId: 'event-1',
        initialInventory: 1,
        available: 0,
      }),
    };

    dataSourceMock.transaction.mockImplementation(async (callback) => callback(manager));

    await expect(
      ordersService.create({
        eventId: 'event-1',
        userId: 'user-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns all orders sorted by creation date', async () => {
    const orders = [
      {
        id: 'order-2',
        eventId: 'event-2',
        userId: 'user-2',
        quantity: 3,
        status: 'confirmed',
      },
    ];

    (repositoryMock.find as jest.Mock).mockResolvedValue(orders);

    await expect(ordersService.findAll()).resolves.toEqual(orders);
    expect(repositoryMock.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });
});