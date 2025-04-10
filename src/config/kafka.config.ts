import { Kafka, Producer, Consumer, Partitioners } from "kafkajs";

class KafkaSingleton {
  private static instance: KafkaSingleton;
  private kafka: Kafka;
  private producer: Producer;
  private producerConnected: boolean = false;
  private consumers: Record<string, Consumer> = {}; // Lưu consumer theo groupId

  private constructor() {
    this.kafka = new Kafka({
      clientId: "inventory-service",
      brokers: [
        process.env.BROKER_KAFKA_1 as string,
        process.env.BROKER_KAFKA_2 as string,
        process.env.BROKER_KAFKA_3 as string
      ],
      retry: {
        initialRetryTime: 300,
        retries: 10,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  public static getInstance(): KafkaSingleton {
    if (!KafkaSingleton.instance) {
      KafkaSingleton.instance = new KafkaSingleton();
    }
    return KafkaSingleton.instance;
  }

  public async getProducer(): Promise<Producer> {
    if (!this.producerConnected) {
      await this.producer.connect();
      this.producerConnected = true;
      console.log("✅ Kafka Producer connected!");
    }
    return this.producer;
  }

  public async getConsumer(groupId: string): Promise<Consumer> {
    if (!this.consumers[groupId]) {
      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      this.consumers[groupId] = consumer;
      console.log(`✅ Kafka Consumer connected (Group: ${groupId})`);
    }
    return this.consumers[groupId];
  }
}

export default KafkaSingleton.getInstance();