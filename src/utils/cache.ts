'use strict'

import { getRedis } from '../config/redis.config'

const redisCache = getRedis().instanceConnect

// import Redis from 'ioredis'

// const redisCache = new Redis({
//   port: 19354, // Redis port
//   host: 'junction.proxy.rlwy.net', // Redis host
//   username: 'default', // needs Redis >= 6
//   password: 'fLOyfHRDMLkQZSeVsgrpCCEixFEqqkXb',
//   db: 0 // Defaults to 0
// })

// const config = {
//   // port: Number(process.env.REDIS_PORT), // Redis port
//   // host: process.env.REDIS_HOST, // Redis host
//   // username: process.env.REDIS_USERNAME, // needs Redis >= 6
//   // password: process.env.REDIS_PASSWORD,
//   // db: 0
//   port: 19354, // Redis port
//   host: 'junction.proxy.rlwy.net', // Redis host
//   username: 'default', // needs Redis >= 6
//   password: 'fLOyfHRDMLkQZSeVsgrpCCEixFEqqkXb',
//   db: 0 // Defaults to 0
// }

// const redisCache = new Redis(config)

export const setCacheIO = async (key: string, value: any) => {
  if (!redisCache) {
    throw new Error('Redis client not initialized')
  }
  try {
    return await redisCache.set(key, JSON.stringify(value))
  } catch (error) {
    throw new Error(error.message)
  }
}

export const setCacheIOExpiration = async (key: string, value: string, expirationInSeconds: any) => {
  if (!redisCache) {
    throw new Error('Redis client not initialized')
  }
  try {
    return await redisCache.set(key, JSON.stringify(value), 'EX', expirationInSeconds)
  } catch (error) {
    console.log('error::::::', error.message)
    throw new Error(error.message)
  }
}

export const getCacheIO = async (key: string) => {
  if (!redisCache) {
    throw new Error('Redis client not initialized')
  }
  try {
    const result = await redisCache.get(key)
    return JSON.parse(result)
  } catch (error) {
    throw new Error(error.message)
  }
}

export const deleteCacheIO = async (key: string) => {
  if (!redisCache) {
    throw new Error('Redis client not initialized')
  }
  try {
    return await redisCache.del(key)
  } catch (error) {
    throw new Error(error.message)
  }
}
