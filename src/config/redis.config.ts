import redis from 'ioredis'
import 'dotenv/config'

const statusConnectRedis = {
  CONNECT: 'connect',
  END: 'end',
  ERROR: 'error',
  RECONNECT: 'reconnecting'
}

const handleEventConnection = ({ connectionRedis }: { connectionRedis: any }) => {
  connectionRedis.on(statusConnectRedis.CONNECT, () => {
    console.log('connection Redis - Connection status: connected')
  })
  connectionRedis.on(statusConnectRedis.END, () => {
    console.log('connection Redis - Connection status: disconnected')
  })
  connectionRedis.on(statusConnectRedis.RECONNECT, () => {
    console.log('connection Redis - Connection status: reconnecting')
  })
  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.log(`connection Redis - Connection status: error ${err}`)
  })
}
export const initRedis = () => {
  // const instanceRedis = new redis({
  //   port: Number(process.env.REDIS_PORT),
  //   host: process.env.REDIS_HOST,
  //   username: process.env.REDIS_USERNAME,
  //   password: process.env.REDIS_PASSWORD
  // })
  const instanceRedis = new redis("rediss://default:AVNS_nzu46kPwrfQYp6Cc9Np@caching-32653a4c-vminhduc8-88ed.e.aivencloud.com:13891")

  const client = { instanceConnect: instanceRedis }
  handleEventConnection({ connectionRedis: instanceRedis })
  return client
}

const client = initRedis()
export const getRedis = () => client
