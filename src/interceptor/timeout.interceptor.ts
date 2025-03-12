import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common'
import { Observable, throwError, timeout, catchError } from 'rxjs'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(30000), // 30s timeout
      catchError((err) => throwError(() => new RequestTimeoutException('Request timeout after 30 seconds')))
    )
  }
}
