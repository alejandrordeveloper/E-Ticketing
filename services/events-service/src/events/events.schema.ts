import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ versionKey: false, timestamps: true })
export class Event {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, min: 0 })
  inventory!: number;
}

export const EventSchema = SchemaFactory.createForClass(Event);