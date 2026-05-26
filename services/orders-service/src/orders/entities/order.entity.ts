import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class Order {
  @ApiProperty({ example: 'a6ec1a46-6f0a-4af4-9927-9f0899274b0f' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'event-1' })
  @Column({ type: 'varchar', length: 255 })
  eventId!: string;

  @ApiProperty({ example: 'user-1' })
  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'int' })
  quantity!: number;

  @ApiProperty({ example: 'confirmed' })
  @Column({ type: 'varchar', length: 30, default: 'confirmed' })
  status!: string;

  @ApiProperty({ example: '2026-08-15T14:05:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;
}