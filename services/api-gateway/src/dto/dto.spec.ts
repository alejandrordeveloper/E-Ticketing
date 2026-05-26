import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateEventDto } from './create-event.dto';
import { CreateOrderDto } from './create-order.dto';
import { CreateStockDto } from './create-stock.dto';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

describe('Gateway DTOs', () => {
  it('normalizes login email', () => {
    const dto = plainToInstance(LoginDto, {
      email: '  USER@EMAIL.COM ',
      password: 'testpassword123',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.email).toBe('user@email.com');
  });

  it('normalizes registration email and username', () => {
    const dto = plainToInstance(RegisterDto, {
      username: ' testuser ',
      email: ' USER@EMAIL.COM ',
      password: 'testpassword123',
    });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.username).toBe('testuser');
    expect(dto.email).toBe('user@email.com');
  });

  it('transforms numeric DTO fields', () => {
    const eventDto = plainToInstance(CreateEventDto, {
      name: 'Festival',
      description: 'Evento',
      date: '2026-08-15T14:00:00.000Z',
      inventory: '5',
    });
    const orderDto = plainToInstance(CreateOrderDto, {
      eventId: 'event-1',
      userId: 'user-1',
      quantity: '2',
    });
    const stockDto = plainToInstance(CreateStockDto, {
      eventId: 'event-1',
      initialInventory: '10',
    });

    expect(validateSync(eventDto)).toHaveLength(0);
    expect(validateSync(orderDto)).toHaveLength(0);
    expect(validateSync(stockDto)).toHaveLength(0);
    expect(eventDto.inventory).toBe(5);
    expect(orderDto.quantity).toBe(2);
    expect(stockDto.initialInventory).toBe(10);
  });
});