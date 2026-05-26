import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (this.isAxiosError(exception)) {
      const status = exception.response?.status ?? HttpStatus.BAD_GATEWAY;
      const upstreamData = exception.response?.data;

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error: 'Upstream Service Error',
        message: this.extractAxiosMessage(exception, upstreamData),
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message ?? exception.message;

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error: exception.name,
        message,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: 'Internal Server Error',
      message: 'Unexpected error',
    });
  }

  private isAxiosError(exception: unknown): exception is AxiosError {
    return typeof exception === 'object' && exception !== null && 'isAxiosError' in exception;
  }

  private extractAxiosMessage(
    exception: AxiosError,
    upstreamData: unknown,
  ): string | string[] | Record<string, unknown> {
    if (typeof upstreamData === 'string' || Array.isArray(upstreamData)) {
      return upstreamData;
    }

    if (typeof upstreamData === 'object' && upstreamData !== null) {
      const message = (upstreamData as { message?: unknown }).message;
      if (typeof message === 'string' || Array.isArray(message)) {
        return message;
      }
      return upstreamData as Record<string, unknown>;
    }

    return exception.message || 'Upstream service request failed';
  }
}