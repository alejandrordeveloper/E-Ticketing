import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Event extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true })
  inventory!: number;

}

export const EventSchema = SchemaFactory.createForClass(Event);
