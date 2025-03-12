import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { UnauthorizedCodeError } from 'src/utils/errorResponse'
import { findAccoutById, findEmployeeByIdOfToken, findRefreshToken, findRestaurantByIdOfToken, verifyToken } from './query/authen.guard'

@Injectable()
export class AccountAuthGuard implements CanActivate {
  constructor(
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const access_token_rtr = request.headers['x-at-rtr'] ? request.headers['x-at-rtr'].split(' ')[1] : null
    const refresh_token_rtr = request.headers['x-rf-rtr'] ? request.headers['x-rf-rtr'].split(' ')[1] : null

    const access_token_epl = request.headers['x-at-epl'] ? request.headers['x-at-epl'].split(' ')[1] : null
    const refresh_token_epl = request.headers['x-rf-epl'] ? request.headers['x-rf-epl'].split(' ')[1] : null

    const access_token = access_token_rtr ? access_token_rtr : access_token_epl
    const refresh_token = refresh_token_rtr ? refresh_token_rtr : refresh_token_epl

    if (!access_token || !refresh_token) throw new UnauthorizedCodeError('Token không hợp lệ1', -10)
    // if (!access_token || !refresh_token) throw new ForbiddenError('Token không hợp lệ1')

    try {
      const { rf_public_key_refresh_token, rf_public_key_access_token } = await findRefreshToken({
        rf_refresh_token: refresh_token
      })

      if (!rf_public_key_refresh_token || !rf_public_key_access_token)
        throw new UnauthorizedCodeError('Token không hợp lệ4', -10)

      const dataToken = await Promise.all([
        verifyToken(access_token, rf_public_key_access_token),
        verifyToken(refresh_token, rf_public_key_refresh_token)
      ])

      if (!dataToken[0] || !dataToken[1]) throw new UnauthorizedCodeError('Token không hợp lệ2', -10)

      const account: any = await findAccoutById({ _id: dataToken[0]._id })
      if (!account) throw new UnauthorizedCodeError('Token không hợp lệ 5', -10)

      if (account.account_type === 'restaurant') {
        const restaurant = await findRestaurantByIdOfToken({ _id: account.account_restaurant_id })
        if (!restaurant) throw new UnauthorizedCodeError('Token không hợp lệ 5', -10)

        account.account_password = undefined
        request.account = account
        return true
      }

      if (account.account_type === 'employee') {
        const employee = await findEmployeeByIdOfToken({ _id: account.account_employee_id })
        if (!employee) throw new UnauthorizedCodeError('Token không hợp lệ 5', -10)

        account.account_password = undefined
        request.account = account
        return true
      }
      return true
    } catch (error) {
      saveLogSystem({
        type: 'error',
        message: error.message,
        action: 'canActivate',
        class: 'AccountAuthGuard',
        function: 'canActivate',
        time: new Date(),
        error: error
      })
      throw new UnauthorizedCodeError('Token không hợp lệ 3', -10)
    }
  }
}
