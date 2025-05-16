import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OrderFoodEntity } from './order-food.entity'
import { OrderFoodItemEntity } from './order-food-item.entity'
import { FoodSnapEntity } from './food-snap.entity'
import {
  addDocToElasticsearch,
  deleteAllDocByElasticsearch,
  indexElasticsearchExists
} from 'src/utils/elasticsearch'
import {
  ORDER_FOOD_ELASTICSEARCH_INDEX,
  ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX,
  FOOD_SNAP_ELASTICSEARCH_INDEX
} from 'src/constants/index.elasticsearch'

@Injectable()
export class OrderFoodRepo implements OnModuleInit {
  constructor(
    @InjectRepository(OrderFoodEntity)
    private readonly orderFoodRepository: Repository<OrderFoodEntity>,
    @InjectRepository(OrderFoodItemEntity)
    private readonly orderFoodItemRepository: Repository<OrderFoodItemEntity>,
    @InjectRepository(FoodSnapEntity)
    private readonly foodSnapRepository: Repository<FoodSnapEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }

    // Sync OrderFood
    const orderFoods = await this.orderFoodRepository.find({
      relations: ['orderItems', 'orderItems.foodSnap']
    })
    const orderFoodIndexExist = await indexElasticsearchExists(ORDER_FOOD_ELASTICSEARCH_INDEX)
    if (orderFoodIndexExist) {
      await deleteAllDocByElasticsearch(ORDER_FOOD_ELASTICSEARCH_INDEX)
    }
    for (const doc of orderFoods) {
      await addDocToElasticsearch(ORDER_FOOD_ELASTICSEARCH_INDEX, doc.od_id.toString(), doc)
    }

    // Sync OrderFoodItem
    const orderFoodItems = await this.orderFoodItemRepository.find({
      relations: ['foodSnap', 'order']
    })
    const orderFoodItemIndexExist = await indexElasticsearchExists(ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX)
    if (orderFoodItemIndexExist) {
      await deleteAllDocByElasticsearch(ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX)
    }
    for (const doc of orderFoodItems) {
      await addDocToElasticsearch(ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX, doc.od_it_id.toString(), doc)
    }

    // Sync FoodSnap
    const foodSnaps = await this.foodSnapRepository.find({
      relations: ['orderItems']
    })
    const foodSnapIndexExist = await indexElasticsearchExists(FOOD_SNAP_ELASTICSEARCH_INDEX)
    if (foodSnapIndexExist) {
      await deleteAllDocByElasticsearch(FOOD_SNAP_ELASTICSEARCH_INDEX)
    }
    for (const doc of foodSnaps) {
      await addDocToElasticsearch(FOOD_SNAP_ELASTICSEARCH_INDEX, doc.fsnp_id.toString(), doc)
    }
  }
}