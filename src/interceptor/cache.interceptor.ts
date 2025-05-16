// common/interceptors/cache.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getCacheIO, setCacheIO, setCacheIOExpiration } from 'src/utils/cache';


@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly ttl = 3;

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Chỉ cache các request GET
    if (method !== 'GET') return next.handle();

    const key = `cache:${request.originalUrl}`;

    try {
      const cached = await getCacheIO(key)
      if (cached) {
        console.log('data cache');
        return of(JSON.parse(cached));
      }
      console.log('data not cache');
    } catch (err) {
      console.error('Redis GET error:', err.message);
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await setCacheIOExpiration(key, JSON.stringify(response), this.ttl);
        } catch (err) {
          console.error('Redis SET error:', err.message);
        }
      }),
    );
  }
}
