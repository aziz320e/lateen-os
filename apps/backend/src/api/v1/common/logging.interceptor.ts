import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { tap, type Observable } from 'rxjs';

/** Logs method, path, and duration for every REST API v1 request. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('REST API v1');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const start = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => this.logger.log(`${request.method} ${request.url} — ${Date.now() - start}ms`)),
      );
  }
}
