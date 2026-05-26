import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateStockDto {
  @ApiProperty({ example: 'event-1' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ example: 50, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  initialInventory!: number;
}