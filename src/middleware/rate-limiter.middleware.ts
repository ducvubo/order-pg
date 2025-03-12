import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { getRedis } from '../config/redis.config'
import { BadRequestError } from 'src/utils/errorResponse'

const redisCache = getRedis().instanceConnect

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly windowSize = 60 // 60 giây
  private readonly maxRequests = 2 // Tối đa 10 request mỗi phút

  async use(req: Request, res: Response, next: NextFunction) {
    if (!redisCache) {
      throw new Error('Redis client not initialized')
    }

    const ip = req.ip || req.connection.remoteAddress // Lấy IP của người dùng
    const key = `rate_limit:${ip}`

    try {
      const requests = await redisCache.get(key)
      let requestCount = requests ? parseInt(requests, 10) : 0

      if (requestCount >= this.maxRequests) {
        throw new BadRequestError('Bạn đã thực hiện quá nhiều yêu cầu, vui lòng thử lại sau')
      }

      await redisCache.set(key, requestCount + 1, 'EX', this.windowSize)
      next()
    } catch (error) {
      throw new BadRequestError('Bạn đã thực hiện quá nhiều yêu cầu, vui lòng thử lại sau')
    }
  }
}
