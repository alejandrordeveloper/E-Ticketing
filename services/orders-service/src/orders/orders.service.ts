import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { EventStock } from './entities/event-stock.entity';
import { Order } from './entities/order.entity';
import { OrderEventsPublisher } from './order-events.publisher';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderEventsPublisher: OrderEventsPublisher,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(EventStock)
    private readonly eventStockRepository: Repository<EventStock>,
  ) {}

  async upsertStock(createStockDto: CreateStockDto): Promise<EventStock> {
    const existingStock = await this.eventStockRepository.findOne({
      where: { eventId: createStockDto.eventId },
    });

    if (existingStock) {
      existingStock.initialInventory = createStockDto.initialInventory;
      existingStock.available = createStockDto.initialInventory;
      return this.eventStockRepository.save(existingStock);
    }

    const stock = this.eventStockRepository.create({
      eventId: createStockDto.eventId,
      initialInventory: createStockDto.initialInventory,
      available: createStockDto.initialInventory,
    });

    return this.eventStockRepository.save(stock);
  }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const createdOrder = await this.dataSource.transaction(async (manager) => {
      const lockedStock = await manager.findOne(EventStock, {
        where: { eventId: createOrderDto.eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedStock) {
        throw new NotFoundException('Stock not found for the specified event');
      }

      if (lockedStock.available < createOrderDto.quantity) {
        throw new ConflictException('Insufficient inventory for this event');
      }

      lockedStock.available -= createOrderDto.quantity;
      await manager.save(EventStock, lockedStock);

      const order = manager.create(Order, {
        ...createOrderDto,
        status: 'confirmed',
      });

      return manager.save(Order, order);
    });

    await this.orderEventsPublisher.publishOrderConfirmed(createdOrder);

    return createdOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}