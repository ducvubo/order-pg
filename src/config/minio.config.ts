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
    endPoint: '160.191.51.57',
    port: 9000,
    useSSL: false,
    accessKey: '0u3Cu2pEQwjlx9dbax83',
    secretKey: 'q35EwvrEsqnYuxsNlmcAjAPCWuCKQxNkEzuFa4bU'
  })

  const client = { instanceConnect: instanceMinio }
  handleEventConnection({ connectionMinio: instanceMinio })
  return client
}

const client = initMinio()
export const getMinio = () => client
