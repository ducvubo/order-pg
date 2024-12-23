import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception?.status || 500

    response.status(status).json({
      statusCode: status,
      message: exception?.message || 'Đã có lỗi xảy ra vui lòng thử lại sau ít phút1',
      error: exception?.response || 'Đã có lỗi xảy ra vui lòng thử lại sau ít phút1'
    })
  }
}
