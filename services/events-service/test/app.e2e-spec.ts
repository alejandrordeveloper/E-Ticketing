import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import request from 'supertest';
import { App } from 'supertest/types';
import { EventsController } from './../src/events/events.controller';
import { EventsService } from './../src/events/events.service';

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;

  const eventsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    eventsServiceMock.create.mockReset();
    eventsServiceMock.findAll.mockReset();
  });

  it('/events (GET)', async () => {
    const events = [
      {
        name: 'Festival',
        description: 'Evento publicado',
        date: '2026-07-10T19:30:00.000Z',
        inventory: 50,
      },
    ];

    eventsServiceMock.findAll.mockResolvedValue(events);

    await request(app.getHttpServer()).get('/events').expect(200).expect(events);
  });

  it('/events (POST)', async () => {
    const payload = {
      name: 'Conferencia',
      description: 'Evento de tecnologia',
      date: '2026-08-15T14:00:00.000Z',
      inventory: 120,
    };

    eventsServiceMock.create.mockResolvedValue(payload);

    await request(app.getHttpServer())
      .post('/events')
      .send(payload)
      .expect(201)
      .expect(payload);

    expect(eventsServiceMock.create).toHaveBeenCalledWith(payload);
  });

  it('/events (POST) returns standardized validation errors', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .send({
        name: '',
        description: 'Evento con payload invalido',
        date: 'invalid-date',
        inventory: -1,
        extraField: true,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed',
          path: '/events',
          service: 'events-service',
        });
        expect(body.timestamp).toEqual(expect.any(String));
        expect(body.details).toEqual(
          expect.arrayContaining([
            expect.stringContaining('name'),
            expect.stringContaining('date'),
            expect.stringContaining('inventory'),
            expect.stringContaining('extraField'),
          ]),
        );
      });

    expect(eventsServiceMock.create).not.toHaveBeenCalled();
  });

  afterEach(async () => {
    await app.close();
  });
});
