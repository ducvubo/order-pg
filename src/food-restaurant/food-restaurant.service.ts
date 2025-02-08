import { Injectable, OnModuleInit } from '@nestjs/common'
import { FoodRestaurantRepo } from './entities/food-restaurant.repo'
import { CreateFoodRestaurantDto } from './dto/create-food-restaurant.dto'
import { FoodRestaurantEntity } from './entities/food-restaurant.entity'
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
import { DataSource, UpdateResult } from 'typeorm'
import { UpdateStateFoodRestaurantDto } from './dto/update-state-food-restaurant.dto'
import { saveLogSystem } from 'src/log/sendLog.els'
import 'dotenv/config'
import { FoodRestaurantQuery } from './entities/food-restaurant.query'
import { FoodOptionsRepo } from 'src/food-options/entities/food-options.repo'
import { FoodOptionsQuery } from 'src/food-options/entities/food-options.query'
import { FoodOptionsEntity } from 'src/food-options/entities/food-options.entity'

@Injectable()
export class FoodRestaurantService implements OnModuleInit {
  constructor(
    private readonly foodRestaurantRepo: FoodRestaurantRepo,
    private readonly foodRestaurantQuery: FoodRestaurantQuery,
    private readonly foodOptionsRepo: FoodOptionsRepo,
    private readonly foodOptionQuery: FoodOptionsQuery,
    private readonly dataSource: DataSource
  ) {}

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

  async create(createFoodRestaurantDto: CreateFoodRestaurantDto, account: IAccount): Promise<FoodRestaurantEntity> {
    const queryRunner = this.dataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const {
        food_cat_id,
        food_close_time,
        food_description,
        food_image,
        food_name,
        food_note,
        food_open_time,
        food_options,
        food_price,
        food_sort
      } = createFoodRestaurantDto

      const categoryExist: IBackendGRPC = await firstValueFrom(
        (await this.CategoryRestaurantServiceGrpc.findOneCatRes({
          id: food_cat_id,
          catResId: account.account_restaurant_id.toString()
        })) as any
      )

      if (!categoryExist.status) {
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      const slug = slugify(createFoodRestaurantDto.food_name, { lower: true, strict: true })

      const newFood = await queryRunner.manager.save(FoodRestaurantEntity, {
        food_cat_id,
        food_close_time,
        food_description,
        food_image,
        food_name,
        food_note,
        food_open_time,
        food_price,
        food_sort,
        food_slug: slug,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        food_res_id: account.account_restaurant_id
      })

      if (food_options.length !== 0 && newFood.food_id) {
        await Promise.all(
          food_options.map((option) =>
            queryRunner.manager.save(FoodOptionsEntity, {
              fopt_food_id: newFood.food_id,
              fopt_image: option.fopt_image,
              fopt_name: option.fopt_name,
              fopt_price: option.fopt_price,
              fopt_attribute: option.fopt_attribute,
              fopt_note: option.fopt_note,
              fopt_state: option.fopt_state,
              fopt_status: option.fopt_status,
              fopt_res_id: account.account_restaurant_id,
              createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
            })
          )
        )
      }

      await queryRunner.commitTransaction()
      return newFood
    } catch (error) {
      await queryRunner.rollbackTransaction()
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
    } finally {
      await queryRunner.release()
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
  ): Promise<ResultPagination<FoodRestaurantEntity>> {
    try {
      if (!food_name && typeof food_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodRestaurantQuery.findAllPagination(
        { pageSize, pageIndex, food_name, isDeleted: 0 },
        account
      )

      if (!dataFood?.result.length) {
        return {
          meta: {
            current: pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

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
  ): Promise<ResultPagination<FoodRestaurantEntity>> {
    try {
      if (!food_name && typeof food_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodRestaurantQuery.findAllPagination(
        { pageSize, pageIndex, food_name, isDeleted: 1 },
        account
      )

      if (!dataFood?.result.length) {
        return {
          meta: {
            current: pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

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

  async findOne(id: string, account: IAccount): Promise<FoodRestaurantEntity & { food_options: FoodOptionsEntity[] }> {
    try {
      const data = await this.foodRestaurantQuery.findOne(id, account)

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
        throw new BadRequestError('Danh mục món ăn không tồn tại')
      }

      data.food_cat_id = JSON.parse(categoryExist.data)

      const food_options = await this.foodOptionQuery.findOptionByIdFood(id, account.account_restaurant_id)

      return {
        ...data,
        food_options
      }
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
    const queryRunner = this.dataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
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
        food_sort,
        food_options
      } = updateFoodRestaurantDto

      const foodExits = await this.foodRestaurantQuery.findOne(food_id, account)
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

      const listOptionOld = await this.foodOptionQuery.findOptionByIdFood(food_id, account.account_restaurant_id)

      if (food_options.length !== 0 && listOptionOld.length !== 0) {
        await Promise.all(
          listOptionOld.map((option) =>
            queryRunner.manager.remove(FoodOptionsEntity, {
              fopt_id: option.fopt_id
            })
          )
        )

        await Promise.all(
          food_options.map((option) =>
            queryRunner.manager.save(FoodOptionsEntity, {
              fopt_food_id: food_id,
              fopt_image: option.fopt_image,
              fopt_name: option.fopt_name,
              fopt_price: option.fopt_price,
              fopt_attribute: option.fopt_attribute,
              fopt_note: option.fopt_note,
              fopt_state: option.fopt_state,
              fopt_status: option.fopt_status,
              fopt_res_id: account.account_restaurant_id,
              createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
            })
          )
        )
      }

      const updated = await queryRunner.manager
        .createQueryBuilder()
        .update(FoodRestaurantEntity)
        .set({
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
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedAt: new Date()
        })
        .where({
          food_id: food_id,
          food_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()
      return updated
    } catch (error) {
      await queryRunner.rollbackTransaction()
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
    } finally {
      await queryRunner.release()
    }
  }

  async updateStatus(
    updateStatusFoodRestaurantDto: UpdateStatusFoodRestaurantDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const { food_id, food_status } = updateStatusFoodRestaurantDto

      const foodExits = await this.foodRestaurantQuery.findOne(food_id, account)
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

      const foodExits = await this.foodRestaurantQuery.findOne(food_id, account)
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
      const foodExits = await this.foodRestaurantQuery.findOne(id, account)
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
      const foodExits = await this.foodRestaurantQuery.findOne(id, account)
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

  async findFoodName(account: IAccount): Promise<FoodRestaurantEntity[]> {
    try {
      const data = await this.foodRestaurantQuery.findFoodName(account)
      return data
    } catch (error) {
      saveLogSystem({
        action: 'findFoodName',
        class: 'FoodRestaurantService',
        function: 'findFoodName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findFoodRestaurants(food_res_id: string): Promise<FoodRestaurantEntity[]> {
    try {
      const data = await this.foodRestaurantQuery.findFoodRestaurants(food_res_id)
      return data
    } catch (error) {
      saveLogSystem({
        action: 'findFoodRestaurants',
        class: 'FoodRestaurantService',
        function: 'findFoodRestaurants',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
