import { HttpException, HttpStatus } from '@nestjs/common'

export class ConflictError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT)
  }
}

export class ServerError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}

export class ServerErrorDefault extends HttpException {
  private readonly customCode: number
  constructor(error: any) {
    const message = error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau ít phút'
    const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR
    super({ message, code: error?.customCode || 0, status }, status)
    this.customCode = error?.customCode || 0
  }
  getCustomCode(): number {
    return this.customCode
  }
}

export class BadRequestError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST)
  }
}

export class NotFoundError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.NOT_FOUND)
  }
}

export class UnauthorizedError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED)
  }
}

export class UnauthorizedCodeError extends HttpException {
  private readonly customCode: number

  constructor(message: string, customCode: number) {
    super(message, HttpStatus.UNAUTHORIZED)
    this.customCode = customCode
  }

  getCustomCode(): number {
    return this.customCode
  }
}

export class ForbiddenError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN)
  }
}
