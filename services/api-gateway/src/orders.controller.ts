import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreProxyService } from './core-proxy.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly coreProxyService: CoreProxyService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(@Headers('authorization') authorization?: string) {
    return this.coreProxyService.get(`${this.ordersServiceUrl}/orders`, {
      headers: this.forwardAuthHeader(authorization),
    });
  }

  @Post()
  async create(@Body() body: unknown, @Headers('authorization') authorization?: string) {
    return this.coreProxyService.post(`${this.ordersServiceUrl}/orders`, body, {
      headers: this.forwardAuthHeader(authorization),
    });
  }

  @Post('stock')
  async upsertStock(@Body() body: unknown, @Headers('authorization') authorization?: string) {
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