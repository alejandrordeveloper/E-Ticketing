import { ConsoleLogger } from '@nestjs/common';

export class StructuredLogger extends ConsoleLogger {
  constructor(private readonly serviceName: string) {
    super();
  }

  log(message: unknown, context?: string): void {
    this.printMessage('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.printMessage('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.printMessage('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.printMessage('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.printMessage('verbose', message, context);
  }

  private printMessage(level: string, message: unknown, context?: string, trace?: string): void {
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      context: context ?? this.context,
      message: this.normalizeMessage(message),
    };

    if (trace) {
      payload.trace = trace;
    }

    const line = `${JSON.stringify(payload)}\n`;
    if (level === 'error') {
      process.stderr.write(line);
      return;
    }

    process.stdout.write(line);
  }

  private normalizeMessage(message: unknown): unknown {
    if (message instanceof Error) {
      return {
        name: message.name,
        message: message.message,
      };
    }

    return message;
  }
}