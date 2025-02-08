import 'dotenv/config'
import { Kafka } from 'kafkajs'

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
    clientId: 'order-service',
    brokers: [
      process.env.BROKER_KAFKA_1 as string,
      process.env.BROKER_KAFKA_2 as string,
      process.env.BROKER_KAFKA_3 as string
    ]
    // brokers: ['223.130.11.174:9092']
    // ssl: {
    //   key: Buffer.from(fs.readFileSync('src/config/keypem/service.key')),
    //   cert: Buffer.from(fs.readFileSync('src/config/keypem/service.cert')),
    //   ca: [Buffer.from(fs.readFileSync('src/config/keypem/ca.pem'))]
    // }
  })

  const client = { instanceConnect: instanceKafka }
  handleEventConnection({ connectionKafka: instanceKafka })
  return client
}

const client = initKafka()
export const getKafka = () => client
