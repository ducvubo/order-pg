'use strict'

import { getRedis } from '../config/redis.config'

const redisCache = getRedis().instanceConnect
export const setCacheIO = async (key: string, value: any) => {
  console.log('setCacheIO::::::', key)
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
  console.log('deleteCacheIO::::::', key)
  if (!redisCache) {
    throw new Error('Redis client not initialized')
  }
  try {
    const result = await redisCache.del(key)
    console.log('deleteCacheIO::::::', result)
    return result
  } catch (error) {
    throw new Error(error.message)
  }
}
