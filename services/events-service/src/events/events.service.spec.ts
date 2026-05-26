import { EventsService } from './events.service';

describe('EventsService', () => {
  const sort = jest.fn().mockReturnThis();
  const lean = jest.fn().mockReturnThis();
  const exec = jest.fn();
  const eventModel = {
    create: jest.fn(),
    find: jest.fn(() => ({ sort, lean, exec })),
  };

  beforeEach(() => {
    eventModel.create.mockReset();
    eventModel.find.mockClear();
    sort.mockClear();
    lean.mockClear();
    exec.mockReset();
  });

  it('creates an event and returns a plain object', async () => {
    eventModel.create.mockResolvedValue({
      toObject: () => ({ id: 'event-1', name: 'Festival' }),
    });
    const service = new EventsService(eventModel as never);

    await expect(
      service.create({
        name: 'Festival',
        description: 'Evento',
        date: '2026-08-15T14:00:00.000Z',
        inventory: 10,
      }),
    ).resolves.toEqual({ id: 'event-1', name: 'Festival' });
  });

  it('returns events sorted by date', async () => {
    exec.mockResolvedValue([{ id: 'event-1' }]);
    const service = new EventsService(eventModel as never);

    await expect(service.findAll()).resolves.toEqual([{ id: 'event-1' }]);
    expect(sort).toHaveBeenCalledWith({ date: 1 });
  });
});