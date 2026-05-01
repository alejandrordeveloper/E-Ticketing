/** Este controlador maneja las solicitudes HTTP relacionadas con los eventos en el sistema de órdenes. Proporciona endpoints para crear, actualizar, eliminar y consultar eventos. */

import { Controller, Get, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './events.schema';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Post()
    async create(@Body() createEventDto: CreateEventDto): Promise<Event> {
        return this.eventsService.create(createEventDto);
    }

    @Get()
    async findAll(): Promise<Event[]> {
        return this.eventsService.findAll();
    }
}