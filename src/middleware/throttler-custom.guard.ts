import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ThrottlerException } from '@nestjs/throttler'
import { BadRequestError } from 'src/utils/errorResponse'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new BadRequestError('Bạn đã thực hiện quá nhiều yêu cầu, vui lòng thử lại sau')
  }
}
