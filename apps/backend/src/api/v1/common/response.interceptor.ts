import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

function isPagedResult(value: unknown): value is { data: unknown; meta: unknown } {
  return typeof value === 'object' && value !== null && 'data' in value && 'meta' in value;
}

/** Wraps every successful response in a consistent `{ success, data, meta? }` envelope. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map((result) =>
          isPagedResult(result) ? { success: true, ...result } : { success: true, data: result },
        ),
      );
  }
}
