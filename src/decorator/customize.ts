import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'

export const RESPONSE_MESSAGE = 'response_message'
export const ResponseMessage = (message: string, statusCode?: number) =>
  SetMetadata(RESPONSE_MESSAGE, { message, statusCode })

// export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): IUser => {
//   const request = ctx.switchToHttp().getRequest()
//   return request.user
// })

export const Acccount = createParamDecorator((data: unknown, ctx: ExecutionContext): IAccount => {
  const request = ctx.switchToHttp().getRequest()
  return request.account
})

// export const GuestRestaurant = createParamDecorator((data: unknown, ctx: ExecutionContext): IGuest => {
//   const request = ctx.switchToHttp().getRequest()
//   return request.guest
// })
