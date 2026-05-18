import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';

describe('EventsController', () => {
  let eventsController: EventsController;

  const eventsServiceMock = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsServiceMock,
        },
      ],
    }).compile();

    eventsController = app.get<EventsController>(EventsController);
    eventsServiceMock.findAll.mockReset();
  });

  it('returns the list of events', async () => {
    const events = [
      {
        name: 'Concierto de prueba',
        description: 'Evento de catálogo',
        date: new Date('2026-06-01T20:00:00.000Z'),
        inventory: 10,
      },
    ];

    eventsServiceMock.findAll.mockResolvedValue(events);

    await expect(eventsController.findAll()).resolves.toEqual(events);
    expect(eventsServiceMock.findAll).toHaveBeenCalledTimes(1);
  });
});
