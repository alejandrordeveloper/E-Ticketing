import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BackstageAdminGuard } from './backstage-admin.guard';
import { CoreProxyService } from './core-proxy.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly coreProxyService: CoreProxyService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'List confirmed orders' })
  @ApiOkResponse({ description: 'Orders list returned successfully' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    return this.coreProxyService.get(`${this.ordersServiceUrl}/orders`, {
      headers: this.forwardAuthHeader(authorization),
    });
  }

  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Order created successfully' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateOrderDto, @Headers('authorization') authorization?: string) {
    return this.coreProxyService.post(`${this.ordersServiceUrl}/orders`, body, {
      headers: this.forwardAuthHeader(authorization),
    });
  }

  @ApiOperation({ summary: 'Initialize or reset sellable stock for an event' })
  @ApiBody({ type: CreateStockDto })
  @ApiCreatedResponse({ description: 'Stock initialized successfully' })
  @UseGuards(JwtAuthGuard, BackstageAdminGuard)
  @Post('stock')
  async upsertStock(@Body() body: CreateStockDto, @Headers('authorization') authorization?: string) {
    return this.coreProxyService.post(`${this.ordersServiceUrl}/orders/stock`, body, {
      headers: this.forwardAuthHeader(authorization),
    });
  }

  private forwardAuthHeader(authorization?: string): Record<string, string> {
    return authorization ? { Authorization: authorization } : {};
  }

  private get ordersServiceUrl(): string {
    return this.configService.getOrThrow<string>('ORDERS_SERVICE_URL');
  }
}