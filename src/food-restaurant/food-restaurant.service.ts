import { Injectable, OnModuleInit } from '@nestjs/common'
import { FoodRestaurantRepo } from './entity/food-restaurant.repo'
import { CreateFoodRestaurantDto } from './dto/create-food-restaurant.dto'
import { FoodRestaurantEntity } from './entity/food-restaurant.entity'
import slugify from 'slugify'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { Client, ClientGrpc, Transport } from '@nestjs/microservices'
import { IBackendGRPC } from 'src/grpc/typescript/api'
import { join } from 'path'
import { ICategoryRestaurantServiceGprcClient } from 'src/grpc/typescript/category-restaurant.client'
import { firstValueFrom } from 'rxjs'
import { ICategoryRestaurantModel } from 'src/modelGrpc/category-restaurant.mode'
import { UpdateFoodRestaurantDto } from './dto/update-food-restaurant.dto'
import { UpdateStatusFoodRestaurantDto } from './dto/update-status-food-restaurant.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStateFoodRestaurantDto } from './dto/update-state-food-restaurant.dto'
import { saveLogSystem } from 'src/log/sendLog.els'
import 'dotenv/config'

@Injectable()
export class FoodRestaurantService implements OnModuleInit {
  constructor(private readonly foodRestaurantRepo: FoodRestaurantRepo) {}

  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'CategoryRestaurantProto',
      protoPath: join(__dirname, '../grpc/proto/category-restaurant.proto'),
      url: process.env.URL_SERVICE_GRPC
    }
  })
  client: ClientGrpc
  private CategoryRestaurantServiceGrpc: ICategoryRestaurantServiceGprcClient

  onModuleInit() {
    this.CategoryRestaurantServiceGrpc = this.client.getService<ICategoryRestaurantServiceGprcClient>(
      'CategoryRestaurantServiceGprc'
    )
  }

  async create(data: CreateFoodRestaurantDto, account: IAccount): Promise<FoodRestaurantEntity> {
    try {
      const foodExits = await this.foodRestaurantRepo.findOneByName(data.food_name, account.account_restaurant_id)

      if (foodExits) {
        throw new BadRequestError('Món ăn đã tồn tại')
      }

      const categoryExist: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findOneCatRes({
          id: data.food_cat_id,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!categoryExist.status) {
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      const slug = slugify(data.food_name)
      return await this.foodRestaurantRepo.create({
        ...data,
        food_slug: slug,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        food_res_id: account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'create',
        class: 'FoodRestaurantService',
        function: 'create',
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
      pageSize,
      pageIndex,
      food_name
    }: {
      pageSize: number
      pageIndex: number
      food_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity[]>> {
    try {
      if (!food_name && typeof food_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodRestaurantRepo.findAll({ pageSize, pageIndex, food_name, isDeleted: 0 }, account)

      const arrCatResId = dataFood.result.map((item) => item.food_cat_id)
      const uniqueArrCatResId = [...new Set(arrCatResId)]

      const dataCategory: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findCatResByArrId({
          arrIdCatRes: uniqueArrCatResId,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!dataCategory.status) {
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      dataFood.result = dataFood.result.map((item) => {
        const category = JSON.parse(dataCategory.data).find(
          (cat: ICategoryRestaurantModel) => cat._id === item.food_cat_id
        )
        return {
          ...item,
          food_cat_id: category
        }
      })

      return dataFood
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'FoodRestaurantService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findRecycle(
    {
      pageSize,
      pageIndex,
      food_name
    }: {
      pageSize: number
      pageIndex: number
      food_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity[]>> {
    try {
      if (!food_name && typeof food_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodRestaurantRepo.findAll({ pageSize, pageIndex, food_name, isDeleted: 1 }, account)

      const arrCatResId = dataFood.result.map((item) => item.food_cat_id)
      const uniqueArrCatResId = [...new Set(arrCatResId)]

      const dataCategory: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findCatResByArrId({
          arrIdCatRes: uniqueArrCatResId,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!dataCategory.status) {
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      dataFood.result = dataFood.result.map((item) => {
        const category = JSON.parse(dataCategory.data).find(
          (cat: ICategoryRestaurantModel) => cat._id === item.food_cat_id
        )
        return {
          ...item,
          food_cat_id: category
        }
      })

      return dataFood
    } catch (error) {
      saveLogSystem({
        action: 'findRecycle',
        class: 'FoodRestaurantService',
        function: 'findRecycle',
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
      const data = await this.foodRestaurantRepo.findOne(id, account)

      if (!data) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      const categoryExist: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findOneCatRes({
          id: data.food_cat_id,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!categoryExist.status) {
        saveLogSystem({
          action: 'findOne',
          class: 'FoodRestaurantService',
          function: 'findOne',
          message: 'Danh mục món ăn không tồn tại',
          time: new Date(),
          error: new Error('Danh mục món ăn không tồn tại'),
          type: 'error'
        })
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      data.food_cat_id = JSON.parse(categoryExist.data)

      return data
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'FoodRestaurantService',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async update(updateFoodRestaurantDto: UpdateFoodRestaurantDto, account: IAccount): Promise<UpdateResult> {
    try {
      const {
        food_id,
        food_cat_id,
        food_description,
        food_close_time,
        food_open_time,
        food_image,
        food_name,
        food_note,
        food_price,
        food_sort
      } = updateFoodRestaurantDto

      const foodExits = await this.foodRestaurantRepo.findOne(food_id, account)
      if (!foodExits) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      const categoryExist: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findOneCatRes({
          id: updateFoodRestaurantDto.food_cat_id,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!categoryExist.status) {
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      return await this.foodRestaurantRepo.update({
        food_id: food_id,
        food_res_id: account.account_restaurant_id,
        food_cat_id: food_cat_id,
        food_description: food_description,
        food_image: food_image,
        food_name: food_name,
        food_note: food_note,
        food_price: food_price,
        food_sort: food_sort,
        food_open_time: food_open_time,
        food_close_time: food_close_time,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'FoodRestaurantService',
        function: 'update',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatus(
    updateStatusFoodRestaurantDto: UpdateStatusFoodRestaurantDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const { food_id, food_status } = updateStatusFoodRestaurantDto

      const foodExits = await this.foodRestaurantRepo.findOne(food_id, account)
      if (!foodExits) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      return await this.foodRestaurantRepo.updateStatus({
        food_id: food_id,
        food_res_id: account.account_restaurant_id,
        food_status: food_status,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateStatus',
        class: 'FoodRestaurantService',
        function: 'updateStatus',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateState(
    updateStateFoodRestaurantDto: UpdateStateFoodRestaurantDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const { food_id, food_state } = updateStateFoodRestaurantDto

      const foodExits = await this.foodRestaurantRepo.findOne(food_id, account)
      if (!foodExits) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      return await this.foodRestaurantRepo.updateState({
        food_id: food_id,
        food_res_id: account.account_restaurant_id,
        food_state: food_state,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateState',
        class: 'FoodRestaurantService',
        function: 'updateState',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async remove(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const foodExits = await this.foodRestaurantRepo.findOne(id, account)
      if (!foodExits) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      return await this.foodRestaurantRepo.remove({
        food_id: id,
        food_res_id: account.account_restaurant_id,
        deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'remove',
        class: 'FoodRestaurantService',
        function: 'remove',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restore(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const foodExits = await this.foodRestaurantRepo.findOne(id, account)
      if (!foodExits) {
        throw new BadRequestError('Món ăn không tồn tại')
      }

      return await this.foodRestaurantRepo.restore({
        food_id: id,
        food_res_id: account.account_restaurant_id,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'restore',
        class: 'FoodRestaurantService',
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
