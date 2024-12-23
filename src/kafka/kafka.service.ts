import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Kafka, Producer } from 'kafkajs'
import * as fs from 'fs'

@Injectable()
export class KafkaService {}
