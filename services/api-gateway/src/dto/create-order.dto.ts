import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'event-1' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ example: 'user-1' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}