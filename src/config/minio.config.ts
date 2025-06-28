import 'dotenv/config'
import { Client } from 'minio'

const handleEventConnection = async ({ connectionMinio }: { connectionMinio: Client }) => {
  try {
    await connectionMinio.listBuckets()
    console.log('Connection Minio - Connection status: connected')
  } catch (error) {
    console.error('Error connecting to Minio:', error.message)
  }
}

export const initMinio = () => {
  const instanceMinio = new Client({
    endPoint: '160.187.229.179',
    port: 9000,
    useSSL: false,
    accessKey: '5NgOHWoz4BXqMFX0hw2y',
    secretKey: 'NATQZqRLdzwKGQMAMblBrqG8nokT2WlltY0EYRqh'
  })


  const client = { instanceConnect: instanceMinio }
  handleEventConnection({ connectionMinio: instanceMinio })
  return client
}

const client = initMinio()
export const getMinio = () => client
