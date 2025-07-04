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
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  })


  const client = { instanceConnect: instanceMinio }
  handleEventConnection({ connectionMinio: instanceMinio })
  return client
}

const client = initMinio()
export const getMinio = () => client
