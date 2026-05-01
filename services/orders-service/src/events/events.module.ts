/** Este módulo maneja la configuración y provisión de los servicios relacionados con los eventos en el sistema de órdenes. */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event, EventSchema } from './events.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }])],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventsModule {}