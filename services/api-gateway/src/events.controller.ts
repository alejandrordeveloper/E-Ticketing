import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreProxyService } from './core-proxy.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly coreProxyService: CoreProxyService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll() {
    return this.coreProxyService.get(`${this.eventsServiceUrl}/events`);
  }

  @Post()
  async create(@Body() body: unknown) {
    return this.coreProxyService.post(`${this.eventsServiceUrl}/events`, body);
  }

  private get eventsServiceUrl(): string {
    return this.configService.getOrThrow<string>('EVENTS_SERVICE_URL');
  }
}