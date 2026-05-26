import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly serviceName = 'events-service';

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response
        .status(status)
        .json(
          this.buildErrorBody(
            request,
            status,
            this.normalizeHttpException(exception, exception.getResponse()),
          ),
        );
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        this.buildErrorBody(request, HttpStatus.INTERNAL_SERVER_ERROR, {
          error: 'Internal Server Error',
          message: 'Unexpected error',
        }),
      );
  }

  private buildErrorBody(
    request: Request,
    statusCode: number,
    normalizedError: NormalizedError,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      statusCode,
      error: normalizedError.error,
      message: normalizedError.message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      service: this.serviceName,
    };

    if (normalizedError.details !== undefined) {
      payload.details = normalizedError.details;
    }

    return payload;
  }

  private normalizeHttpException(
    exception: HttpException,
    exceptionResponse: string | object,
  ): NormalizedError {
    if (typeof exceptionResponse === 'string') {
      return {
        error: this.httpStatusLabel(exception.getStatus()),
        message: exceptionResponse,
      };
    }

    const responseBody = exceptionResponse as {
      error?: unknown;
      message?: unknown;
      details?: unknown;
    };

    if (Array.isArray(responseBody.message)) {
      return {
        error:
          typeof responseBody.error === 'string'
            ? responseBody.error
            : this.httpStatusLabel(exception.getStatus()),
        message: 'Validation failed',
        details: responseBody.message,
      };
    }

    return {
      error:
        typeof responseBody.error === 'string'
          ? responseBody.error
          : this.httpStatusLabel(exception.getStatus()),
      message:
        typeof responseBody.message === 'string' ? responseBody.message : exception.message,
      details: responseBody.details,
    };
  }

  private httpStatusLabel(statusCode: number): string {
    return HttpStatus[statusCode] ?? 'Error';
  }
}

type NormalizedError = {
  error: string;
  message: string;
  details?: unknown;
};