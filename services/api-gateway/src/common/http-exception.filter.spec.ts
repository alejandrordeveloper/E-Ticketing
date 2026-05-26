import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status };
    const request = { url: '/test', originalUrl: '/test' };

    return {
      host: {
        switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
      },
      response,
      json,
      status,
    };
  };

  it('normalizes validation errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, json, status } = createHost();
    const exception = new BadRequestException({
      error: 'Bad Request',
      message: ['email must be an email'],
    });

    filter.catch(exception, host as never);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        service: 'api-gateway',
        details: ['email must be an email'],
      }),
    );
  });

  it('normalizes upstream axios errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, json, status } = createHost();

    filter.catch(
      {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 503,
          data: { error: 'Upstream Error', message: 'Service unavailable' },
        },
      },
      host as never,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        error: 'Upstream Error',
        message: 'Service unavailable',
      }),
    );
  });

  it('handles unexpected errors', () => {
    const filter = new HttpExceptionFilter();
    const { host, json, status } = createHost();

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Unexpected error',
      }),
    );
  });
});