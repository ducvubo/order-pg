import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { FoodComboItemsEntity } from './food-combo-items.entity'

@Injectable()
export class FoodComboItemsRepo implements OnModuleInit {
  constructor(
    @InjectRepository(FoodComboItemsEntity)
    private readonly foodComboItemsRepository: Repository<FoodComboItemsEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: FoodComboItemsEntity[] = await this.foodComboItemsRepository.find()
    const indexExist = await indexElasticsearchExists(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, doc.fcbi_id.toString(), doc)
    }
  }

  async createComboFoodItems(data: FoodComboItemsEntity): Promise<FoodComboItemsEntity> {
    return await this.foodComboItemsRepository.save(data)
  }
}
