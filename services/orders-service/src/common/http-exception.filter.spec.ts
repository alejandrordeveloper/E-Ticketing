import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('Orders HttpExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
          getRequest: () => ({ url: '/orders', originalUrl: '/orders' }),
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
      new BadRequestException({ error: 'Bad Request', message: ['quantity must not be less than 1'] }),
      host as never,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        service: 'orders-service',
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