import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { FOOD_OPTIONS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { FoodOptionsEntity } from './food-options.entity'

@Injectable()
export class FoodOptionsRepo implements OnModuleInit {
  constructor(
    @InjectRepository(FoodOptionsEntity)
    private readonly foodOptionsRepository: Repository<FoodOptionsEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: FoodOptionsEntity[] = await this.foodOptionsRepository.find()
    const indexExist = await indexElasticsearchExists(FOOD_OPTIONS_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(FOOD_OPTIONS_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(FOOD_OPTIONS_ELASTICSEARCH_INDEX, doc.fopt_id.toString(), doc)
    }
  }

  async createFoodOptions(data: FoodOptionsEntity): Promise<FoodOptionsEntity> {
    const result = await this.foodOptionsRepository.save(data)
    return result
  }
}
