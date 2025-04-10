import kafkaInstance from "../config/kafka.config";
interface KafkaMessage {
  topic: string;
  message: string;
}

interface KafkaConsumerConfig {
  topic: string;
  groupId: string;
}

export const sendMessageToKafka = async ({ topic, message }: KafkaMessage): Promise<void> => {
  try {
    const producer = await kafkaInstance.getProducer();
    await producer.send({
      topic,
      messages: [{ value: message }],
    });
    console.log(`📤 Tin nhắn đã được gửi: ${message}`);
  } catch (error) {
    console.error("❌ Producer error:", error);
  }
};

export const receiveMessageFromKafka = async ({ topic, groupId }: KafkaConsumerConfig): Promise<void> => {
  try {
    const consumer = await kafkaInstance.getConsumer(groupId);
    await consumer.subscribe({ topic, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`📥 Nhận tin nhắn từ ${topic}: ${message.value?.toString()}`);
      },
    });
  } catch (error) {
    console.error("❌ Consumer error:", error);
  }
};