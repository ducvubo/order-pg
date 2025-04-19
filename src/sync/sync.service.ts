import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { saveLogSystem } from 'src/log/sendLog.els'
import { getCacheIO, setCacheIOExpiration } from 'src/utils/cache'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { sendMessageToKafka } from 'src/utils/kafka'

@Injectable()
export class SyncService {
  constructor(private readonly jwtService: JwtService) {}

  async createToken(clientId: string): Promise<string> {
    try {
      const payload = {
        sub: clientId,
        iat: Math.floor(Date.now() / 1000)
      }

      const token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '10m'
      })

      await setCacheIOExpiration(`sync_token_${clientId}`, token, 600)

      return token
    } catch (error) {
      saveLogSystem({
        action: 'createToken',
        message: error.message,
        class: 'SyncService',
        function: 'createToken',
        type: 'error',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async verifyToken(token: string, clientId: string): Promise<string> {
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key'
      })

      if (decoded.sub === clientId) {
        return decoded.sub
      }

      const cachExist = await getCacheIO(`sync_token_${decoded.sub}`)
      if (!cachExist) {
        throw new BadRequestError('Lỗi khi đồng bộ dữ liệu')
      }

      sendMessageToKafka({
        topic: 'SYNC_CLIENT_ID',
        message: JSON.stringify({
          clientIdOld: clientId,
          clientIdNew: decoded.sub
        })
      })

      return decoded.sub
    } catch (error) {
      saveLogSystem({
        action: 'verifyToken',
        message: error.message,
        class: 'SyncService',
        function: 'verifyToken',
        type: 'error',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }
}
