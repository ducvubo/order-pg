import { getKafka } from 'src/config/kafka.config'
import { ServerErrorDefault } from './errorResponse'
import { saveLogSystem } from 'src/log/sendLog.els'

const kafka = getKafka().instanceConnect
const admin = kafka.admin()
const producer = kafka.producer()

export const createTopic = async (topic: string) => {
  await admin.connect()
  const topics = await admin.listTopics()
  if (!topics.includes(topic)) {
    console.log(`Topic ${topic} chưa tồn tại. Đang tạo...`)
    await admin.createTopics({
      topics: [{ topic: topic }]
    })
    console.log(`Topic ${topic} đã được tạo.`)
  }
  await admin.disconnect()
}

export const producerSendMessageToKafka = async (topic: string, messages: any) => {
  try {
    await createTopic(topic)
    await producer.connect()
    await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify(messages) }]
    })
    await producer.disconnect()
  } catch (error) {
    saveLogSystem({
      action: 'producerSendMessageToKafka',
      class: 'kafka',
      function: 'producerSendMessageToKafka',
      message: error.message,
      time: new Date(),
      error: error,
      type: 'error'
    })
    throw new ServerErrorDefault(error)
  }
}
