import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, Response<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in our response format, just return it
        if (data && data.success !== undefined) {
          return data;
        }

        // Otherwise, wrap it in the standard response structure
        return {
          success: true,
          timestamp: new Date().toISOString(),
          ...data,
        };
      }),
    );
  }
}
