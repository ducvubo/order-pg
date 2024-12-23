import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { loggerService } from 'src/middleware/LogToDiscord'
import { v4 as uuidv4 } from 'uuid'
import { ResponseMessage } from './transform.interceptor'
import { RESPONSE_MESSAGE } from 'src/decorator/customize'
import { formatDate } from 'src/utils'
import { saveLogApiError, saveLogApiSuccess } from 'src/log/sendLog.els'

@Injectable()
export class IdUserGuestInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const id_user_guest = request.headers['id_user_guest']
    const id_user_guest_new = `Guest-${uuidv4()}`
    const handler = context.getHandler()
    const messageRes = this.reflector.get<ResponseMessage>(RESPONSE_MESSAGE, handler).message || ''
    const codeHeader = context.switchToHttp().getResponse().statusCode
    const startTime = Date.now()
    const userAgent = request.headers['user-agent']
    const clientIp = request.ip

    if (id_user_guest && id_user_guest !== 'undefined') {
      response.setHeader('id_user_guest', id_user_guest)
    } else if (!id_user_guest || id_user_guest === 'undefined') {
      request.headers['id_user_guest'] = id_user_guest_new
      response.setHeader('id_user_guest', id_user_guest_new)
    }
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime
        const message = ` \n - path: ${request.path} \n - statusCode: ${codeHeader} \n - message: ${messageRes} \n - METHOD: ${request.method} \n - id_user_guest: ${id_user_guest ? id_user_guest : id_user_guest_new} \n - time: ${formatDate(new Date())} \n - duration: ${duration}ms`
        // loggerService.sendLog({
        //   message: message,
        //   params: request.query,
        //   bodyRequest: request.body
        //     ? JSON.stringify(request.body).length > 6000
        //       ? 'Data too long'
        //       : request.body
        //     : 'No data',
        //   headerResponse: {
        //     id_user_guest: id_user_guest ? id_user_guest : id_user_guest_new
        //   },
        //   bodyResponse: JSON.stringify(data).length > 6000 ? 'Data too long' : data
        // })
        saveLogApiSuccess({
          id_user_guest: id_user_guest ? id_user_guest : id_user_guest_new,
          userAgent: userAgent,
          clientIp: clientIp,
          time: new Date(),
          duration: duration,
          message: messageRes,
          bodyRequest: request.body ? request.body : 'No data',
          bodyResponse: data,
          method: request.method,
          params: request.query,
          path: request.path,
          statusCode: codeHeader
        })
      }),
      catchError((error: any) => {
        const duration = Date.now() - startTime
        const message = ` \n - path: ${request.path} \n - statusCode: ${codeHeader} \n - METHOD: ${request.method} \n - id_user_guest: ${id_user_guest ? id_user_guest : id_user_guest_new} \n - time: ${formatDate(new Date())} \n - duration: ${duration}ms`
        // loggerService.sendLog({
        //   message: message,
        //   params: request.query,
        //   bodyRequest: request.body
        //     ? JSON.stringify(request.body).length > 6000
        //       ? 'Data too long'
        //       : request.body
        //     : 'No data',
        //   bodyResponse: {
        //     message: error?.response?.message || error.message || 'Unknown error'
        //   }
        // })
        saveLogApiError({
          id_user_guest: id_user_guest ? id_user_guest : id_user_guest_new,
          userAgent: userAgent,
          clientIp: clientIp,
          time: new Date(),
          duration: duration,
          message: messageRes,
          bodyRequest: request.body ? request.body : 'No data',
          bodyResponse: error?.response?.message || error.message || 'Unknown error',
          method: request.method,
          params: request.query,
          path: request.path,
          statusCode: codeHeader
        })

        return throwError(error)
      })
    )
  }
}
