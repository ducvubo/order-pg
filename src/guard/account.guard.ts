import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenError, UnauthorizedCodeError } from 'src/utils/errorResponse'
import { IAccount } from './interface/account.interface'
import { sendRequest } from 'src/utils/api'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AccountAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    // throw new ForbiddenError('Token không hợp lệ1')
    // throw new UnauthorizedCodeError('Token không hợp lệ1', -10)

    const access_token_rtr = request.headers['x-at-rtr'] ? request.headers['x-at-rtr'].split(' ')[1] : null
    const refresh_token_rtr = request.headers['x-rf-rtr'] ? request.headers['x-rf-rtr'].split(' ')[1] : null

    const access_token_epl = request.headers['x-at-epl'] ? request.headers['x-at-epl'].split(' ')[1] : null
    const refresh_token_epl = request.headers['x-rf-epl'] ? request.headers['x-rf-epl'].split(' ')[1] : null

    const access_token = access_token_rtr ? access_token_rtr : access_token_epl
    const refresh_token = refresh_token_rtr ? refresh_token_rtr : refresh_token_epl

    if (!access_token || !refresh_token) throw new UnauthorizedCodeError('Token không hợp lệ 99', -10)
    // if (!access_token || !refresh_token) throw new ForbiddenError('Token không hợp lệ1')

    try {
      let keyAccess = ''
      let keyRefresh = ''
      if (access_token_epl && refresh_token_epl) {
        keyAccess = 'x-at-epl'
        keyRefresh = 'x-rf-epl'
      }
      if (access_token_rtr && refresh_token_rtr) {
        keyAccess = 'x-at-rtr'
        keyRefresh = 'x-rf-rtr'
      }
      const res: IBackendRes<IAccount> = await sendRequest({
        method: 'POST',
        url: `${this.configService.get('URL_SERVICE_BACK')}/restaurants/authen`,
        headers: {
          [keyAccess]: `Bearer ${access_token}`,
          [keyRefresh]: `Bearer ${refresh_token}`
        }
      })

      if (res.statusCode === 401) throw new UnauthorizedCodeError(res.message, -10)
      if (res.statusCode === 403) throw new ForbiddenError(res.message)
      if (res.statusCode !== 201) throw new UnauthorizedCodeError('Token không hợp lệ 98', -10)

      request.account = res.data
      return true
    } catch (error) {
      console.log(error)
      throw new UnauthorizedCodeError('Token không hợp lệ 97', -10)
    }
  }
}
