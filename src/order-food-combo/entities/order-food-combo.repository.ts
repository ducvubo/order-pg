import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OrderFoodComboEntity } from './order-food-combo.entity'
import { OrderFoodComboItemEntity } from './order-food-combo-item.entity'
import { FoodComboSnapEntity } from './food-combo-snap.entity'
import {
  addDocToElasticsearch,
  deleteAllDocByElasticsearch,
  indexElasticsearchExists
} from 'src/utils/elasticsearch'
import {
  ORDER_FOOD_COMBO_ELASTICSEARCH_INDEX,
  ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX,
  FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX
} from 'src/constants/index.elasticsearch'

@Injectable()
export class OrderFoodComboRepo implements OnModuleInit {
  constructor(
    @InjectRepository(OrderFoodComboEntity)
    private readonly orderFoodComboRepository: Repository<OrderFoodComboEntity>,
    @InjectRepository(OrderFoodComboItemEntity)
    private readonly orderFoodComboItemRepository: Repository<OrderFoodComboItemEntity>,
    @InjectRepository(FoodComboSnapEntity)
    private readonly foodComboSnapRepository: Repository<FoodComboSnapEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }

    // Sync OrderFoodCombo
    const orderFoodCombos = await this.orderFoodComboRepository.find({
      relations: ['orderItems', 'orderItems.foodComboSnap']
    })
    const orderFoodComboIndexExist = await indexElasticsearchExists(ORDER_FOOD_COMBO_ELASTICSEARCH_INDEX)
    if (orderFoodComboIndexExist) {
      await deleteAllDocByElasticsearch(ORDER_FOOD_COMBO_ELASTICSEARCH_INDEX)
    }
    for (const doc of orderFoodCombos) {
      await addDocToElasticsearch(ORDER_FOOD_COMBO_ELASTICSEARCH_INDEX, doc.od_cb_id.toString(), doc)
    }

    // Sync OrderFoodComboItem
    const orderFoodComboItems = await this.orderFoodComboItemRepository.find({
      relations: ['foodComboSnap', 'orderCombo']
    })
    const orderFoodComboItemIndexExist = await indexElasticsearchExists(ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)
    if (orderFoodComboItemIndexExist) {
      await deleteAllDocByElasticsearch(ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)
    }
    for (const doc of orderFoodComboItems) {
      await addDocToElasticsearch(ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, doc.od_cb_it_id.toString(), doc)
    }

    // Sync FoodComboSnap
    const foodComboSnaps = await this.foodComboSnapRepository.find({
      relations: ['orderItems']
    })
    const foodComboSnapIndexExist = await indexElasticsearchExists(FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX)
    if (foodComboSnapIndexExist) {
      await deleteAllDocByElasticsearch(FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX)
    }
    for (const doc of foodComboSnaps) {
      await addDocToElasticsearch(FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX, doc.fcb_snp_id.toString(), doc)
    }
  }
}