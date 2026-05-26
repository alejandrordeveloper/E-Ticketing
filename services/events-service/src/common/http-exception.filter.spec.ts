import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('Events HttpExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
          getRequest: () => ({ url: '/events', originalUrl: '/events' }),
        }),
      },
      json,
      status,
    };
  };

  it('formats validation failures', () => {
    const filter = new HttpExceptionFilter();
    const { host, json } = createHost();

    filter.catch(
      new BadRequestException({ error: 'Bad Request', message: ['name should not be empty'] }),
      host as never,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        service: 'events-service',
      }),
    );
  });

  it('formats unexpected failures', () => {
    const filter = new HttpExceptionFilter();
    const { host, status } = createHost();

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});