import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Conferencia Tech', minLength: 3 })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Evento anual para desarrolladores.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2026-08-15T14:00:00.000Z', format: 'date-time' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 120, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  inventory!: number;
}