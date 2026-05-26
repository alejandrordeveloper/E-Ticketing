import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Festival', minLength: 1 })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Evento publicado' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2026-07-10T19:30:00.000Z', format: 'date-time' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 50, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  inventory!: number;
}