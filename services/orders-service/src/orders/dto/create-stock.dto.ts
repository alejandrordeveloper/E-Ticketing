import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsInt()
  @Min(0)
  initialInventory!: number;
}