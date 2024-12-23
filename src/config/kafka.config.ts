import 'dotenv/config'
import { Kafka } from 'kafkajs'
import * as fs from 'fs-extra'
import 'dotenv/config'

const handleEventConnection = async ({ connectionKafka }: { connectionKafka: any }) => {
  try {
    const admin = connectionKafka.admin()
    await admin.connect()
    console.log('connection Kafka - Connection status: connected')
    admin.disconnect()
  } catch (error) {
    console.log('Error connecting to Kafka:', error)
  }
}
export const initKafka = () => {
  const instanceKafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.BROKER_KAFKA as string],
    ssl: {
      key: Buffer.from(fs.readFileSync('src/config/keypem/service.key')),
      cert: Buffer.from(fs.readFileSync('src/config/keypem/service.cert')),
      ca: [Buffer.from(fs.readFileSync('src/config/keypem/ca.pem'))]
    }
  })

  const client = { instanceConnect: instanceKafka }
  handleEventConnection({ connectionKafka: instanceKafka })
  return client
}

const client = initKafka()
export const getKafka = () => client
