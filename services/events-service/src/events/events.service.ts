import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { Event, EventDocument } from './events.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = await this.eventModel.create(createEventDto);
    return createdEvent.toObject();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().sort({ date: 1 }).lean().exec();
  }
}