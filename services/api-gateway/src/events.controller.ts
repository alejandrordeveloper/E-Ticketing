import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BackstageAdminGuard } from './backstage-admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CoreProxyService } from './core-proxy.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly coreProxyService: CoreProxyService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'List all published events' })
  @ApiOkResponse({ description: 'Events catalog returned successfully' })
  @Get()
  async findAll() {
    return this.coreProxyService.get(`${this.eventsServiceUrl}/events`);
  }

  @ApiOperation({ summary: 'Create a new event in the catalog' })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({ description: 'Event created successfully' })
  @UseGuards(JwtAuthGuard, BackstageAdminGuard)
  @Post()
  async create(@Body() body: CreateEventDto) {
    return this.coreProxyService.post(`${this.eventsServiceUrl}/events`, body);
  }

  private get eventsServiceUrl(): string {
    return this.configService.getOrThrow<string>('EVENTS_SERVICE_URL');
  }
}