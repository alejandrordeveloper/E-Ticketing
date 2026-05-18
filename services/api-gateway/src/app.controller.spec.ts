import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventsController } from './events.controller';
import { CoreProxyService } from './core-proxy.service';

describe('EventsController', () => {
  let eventsController: EventsController;

  const proxyServiceMock = {
    get: jest.fn(),
  };

  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue('http://localhost:3002'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: CoreProxyService,
          useValue: proxyServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    eventsController = app.get<EventsController>(EventsController);
    proxyServiceMock.get.mockReset();
  });

  it('returns events from the events service', async () => {
    const events = [{ id: 'event-1', name: 'Concert' }];

    proxyServiceMock.get.mockResolvedValue(events);

    await expect(eventsController.findAll()).resolves.toEqual(events);
  });
});
