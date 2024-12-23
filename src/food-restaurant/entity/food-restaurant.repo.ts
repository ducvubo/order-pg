import { Like, Repository, UpdateResult } from 'typeorm'
import { FoodRestaurantEntity } from './food-restaurant.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { addDocToOpenSearch, deleteAllDocByOpenSearch, indexOpenSearchExists } from 'src/utils/open-search'
import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'

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
    const indexExist = await indexOpenSearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByOpenSearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToOpenSearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, doc.food_id.toString(), doc)
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

  async findOneByName(food_name: string, food_res_id: string): Promise<FoodRestaurantEntity> {
    try {
      return await this.foodRestaurantRepository.findOne({
        where: { food_name, food_res_id }
      })
    } catch (error) {
      saveLogSystem({
        action: 'findOneByName',
        class: 'FoodRestaurantRepo',
        function: 'findOneByName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      food_name = '',
      pageSize = 10,
      pageIndex = 1,
      isDeleted
    }: {
      food_name: string
      pageSize: number
      pageIndex: number
      isDeleted: 0 | 1
    },
    account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity[]>> {
    try {
      const [results, total] = await this.foodRestaurantRepository.findAndCount({
        where: !food_name.trim()
          ? { food_name: Like(`%${food_name}%`), food_res_id: account.account_restaurant_id, isDeleted }
          : { food_res_id: account.account_restaurant_id, isDeleted: 0 },
        take: pageSize,
        skip: (pageIndex - 1) * pageSize
      })

      return {
        meta: {
          current: pageIndex,
          pageSize,
          totalPage: Math.ceil(total / pageSize),
          totalItem: total
        },
        result: results
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'FoodRestaurantRepo',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(id: string, account: IAccount): Promise<FoodRestaurantEntity> {
    try {
      return await this.foodRestaurantRepository.findOne({
        where: { food_id: id, food_res_id: account.account_restaurant_id }
      })
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'FoodRestaurantRepo',
        function: 'findOne',
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
        .set({ food_status, updatedBy, food_id })
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
        .set({ food_state, updatedBy, food_id })
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
          isDeleted: 0
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
        .set({ isDeleted: 0, deletedBy: null, updatedBy, deletedAt: null, food_id })
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
