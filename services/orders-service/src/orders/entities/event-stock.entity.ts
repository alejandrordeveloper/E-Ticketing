import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'event_stock' })
@Unique(['eventId'])
export class EventStock {
  @ApiProperty({ example: '0d12e4a2-7470-4685-a9db-75ef4ee053f0' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'event-1' })
  @Column({ type: 'varchar', length: 255 })
  eventId!: string;

  @ApiProperty({ example: 50 })
  @Column({ type: 'int' })
  initialInventory!: number;

  @ApiProperty({ example: 48 })
  @Column({ type: 'int' })
  available!: number;

  @ApiProperty({ example: '2026-08-15T13:55:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-15T14:05:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}