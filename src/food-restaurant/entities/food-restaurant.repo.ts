import { Repository, UpdateResult } from 'typeorm'
import { FoodRestaurantEntity } from './food-restaurant.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'

@Injectable()
export class FoodRestaurantRepo implements OnModuleInit {
  constructor(
    @InjectRepository(FoodRestaurantEntity)
    private readonly foodRestaurantRepository: Repository<FoodRestaurantEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: FoodRestaurantEntity[] = await this.foodRestaurantRepository.find()
    const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, doc.food_id.toString(), doc)
    }
  }

  async create(data: FoodRestaurantEntity): Promise<FoodRestaurantEntity> {
    try {
      return await this.foodRestaurantRepository.save(data)
    } catch (error) {
      saveLogSystem({
        action: 'create',
        class: 'FoodRestaurantRepo',
        function: 'create',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async update(foodRestaurantEntity: FoodRestaurantEntity): Promise<UpdateResult> {
    try {
      return await this.foodRestaurantRepository
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .set(foodRestaurantEntity)
        .where({
          food_id: foodRestaurantEntity.food_id,
          food_res_id: foodRestaurantEntity.food_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'FoodRestaurantRepo',
        function: 'update',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatus({
    food_id,
    food_res_id,
    food_status,
    updatedBy
  }: {
    food_id: string
    food_res_id: string
    food_status: string
    updatedBy: string
  }): Promise<UpdateResult> {
    try {
      return await this.foodRestaurantRepository
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .set({ food_status, updatedBy, food_id, updatedAt: new Date() })
        .where({
          food_id,
          food_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatus',
        class: 'FoodRestaurantRepo',
        function: 'updateStatus',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateState({
    food_id,
    food_res_id,
    food_state,
    updatedBy
  }: {
    food_id: string
    food_res_id: string
    food_state: string
    updatedBy: string
  }): Promise<UpdateResult> {
    try {
      return await this.foodRestaurantRepository
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .set({ food_state, updatedBy, food_id, updatedAt: new Date() })
        .where({
          food_id,
          food_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateState',
        class: 'FoodRestaurantRepo',
        function: 'updateState',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async remove({
    food_id,
    food_res_id,
    deletedBy
  }: {
    food_id: string
    food_res_id: string
    deletedBy: string
  }): Promise<UpdateResult> {
    try {
      return await this.foodRestaurantRepository
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .where({
          food_id,
          food_res_id,
          updatedAt: new Date()
        })
        .set({
          food_id,
          isDeleted: 1,
          deletedBy,
          deletedAt: new Date()
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'remove',
        class: 'FoodRestaurantRepo',
        function: 'remove',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restore({
    food_id,
    food_res_id,
    updatedBy
  }: {
    food_id: string
    food_res_id: string
    updatedBy: string
  }): Promise<UpdateResult> {
    try {
      return await this.foodRestaurantRepository
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .set({ isDeleted: 0, deletedBy: null, updatedBy, deletedAt: null, food_id, updatedAt: new Date() })
        .where({
          food_id,
          food_res_id,
          isDeleted: 1
        })

        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restore',
        class: 'FoodRestaurantRepo',
        function: 'restore',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
