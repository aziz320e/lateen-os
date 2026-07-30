import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/**
 * Error Mapping — every business engine throws plain `Error` subclasses
 * defined in its own `shared/errors.ts` (there is no shared base error
 * class across packages). Rather than importing dozens of error classes
 * from eleven packages, this filter maps by naming convention (every
 * package follows the same `XNotFoundError` / `DuplicateXError` /
 * `InvalidXTransitionError` / `XValidationError` / `InsufficientXError`
 * convention) to the correct HTTP status. Nest's own `HttpException`s
 * (from `ValidationPipe`, guards, etc.) pass through unchanged.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      reply.status(exception.getStatus()).send(exception.getResponse());
      return;
    }

    const { status, message } = mapDomainError(exception);
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }
    reply.status(status).send({
      statusCode: status,
      message,
      error: exception instanceof Error ? exception.constructor.name : 'Error',
    });
  }
}

export function mapDomainError(exception: unknown): { status: number; message: string } {
  if (!(exception instanceof Error)) {
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
  const name = exception.constructor.name;

  if (name.endsWith('NotFoundError'))
    return { status: HttpStatus.NOT_FOUND, message: exception.message };
  if (name.startsWith('Duplicate') || name.includes('AlreadyExists'))
    return { status: HttpStatus.CONFLICT, message: exception.message };
  if (name.startsWith('Invalid') || name.includes('Transition'))
    return { status: HttpStatus.CONFLICT, message: exception.message };
  if (
    name.includes('Insufficient') ||
    name.includes('NoVacancy') ||
    name.includes('NoCostLayers')
  ) {
    return { status: HttpStatus.CONFLICT, message: exception.message };
  }
  if (
    name.includes('ValidationError') ||
    name.includes('Unbalanced') ||
    name.includes('InvalidRating')
  ) {
    return { status: HttpStatus.BAD_REQUEST, message: exception.message };
  }
  return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: exception.message };
}
