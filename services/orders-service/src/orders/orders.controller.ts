import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { EventStock } from './entities/event-stock.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Initialize or reset stock for an event' })
  @ApiBody({ type: CreateStockDto })
  @ApiCreatedResponse({ description: 'Stock stored successfully', type: EventStock })
  @Post('stock')
  async upsertStock(@Body() createStockDto: CreateStockDto): Promise<EventStock> {
    return this.ordersService.upsertStock(createStockDto);
  }

  @ApiOperation({ summary: 'Create a confirmed order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Order created successfully', type: Order })
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @ApiOperation({ summary: 'List confirmed orders' })
  @ApiOkResponse({ description: 'Orders returned successfully', type: Order, isArray: true })
  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }
}