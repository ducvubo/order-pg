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
import { getCacheIO, setCacheIO } from 'src/utils/cache'
import kafkaInstance from '../config/kafka.config'
import { callGeminiAPI } from 'src/utils/gemini.api'
import { createWorker } from 'tesseract.js'
import { sendMessageToKafka } from 'src/utils/kafka'

@Injectable()
export class FoodRestaurantService implements OnModuleInit {
  constructor(
    private readonly foodRestaurantRepo: FoodRestaurantRepo,
    private readonly foodRestaurantQuery: FoodRestaurantQuery,
    private readonly foodOptionsRepo: FoodOptionsRepo,
    private readonly foodOptionQuery: FoodOptionsQuery,
    private readonly dataSource: DataSource
  ) { }

  async onModuleInit() {
    const consumer = await kafkaInstance.getConsumer('SYNC_CLIENT_ID_CART_FOOD_RESTAURANT')
    await consumer.subscribe({ topic: 'SYNC_CLIENT_ID', fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const dataMessage = message.value.toString()
        const data = JSON.parse(dataMessage)
        const { clientIdOld, clientIdNew } = data
        //đồng bộ rỏ hàng
        const listFoodCartOld = await getCacheIO(`food_cart_${clientIdOld}`)
        const listFoodCartNew = await getCacheIO(`food_cart_${clientIdNew}`)
        const listFoodCart = []
        if (listFoodCartOld) {
          listFoodCart.push(...listFoodCartOld)
        }
        if (listFoodCartNew) {
          listFoodCart.push(...listFoodCartNew)
        }
        await setCacheIO(`food_cart_${clientIdNew}`, listFoodCart)
      }
    })
  }

  async create(createFoodRestaurantDto: CreateFoodRestaurantDto, account: IAccount): Promise<FoodRestaurantEntity> {
    const queryRunner = this.dataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const {
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


      const slug = slugify(createFoodRestaurantDto.food_name, { lower: true, strict: true })

      const newFood = await queryRunner.manager.save(FoodRestaurantEntity, {
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

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${createFoodRestaurantDto.food_name} vừa được thêm mới`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

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
      await this.foodRestaurantRepo.deleteFood()
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

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${updateFoodRestaurantDto.food_name} vừa được cập nhật`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

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

      const update = await this.foodRestaurantRepo.updateStatus({
        food_id: food_id,
        food_res_id: account.account_restaurant_id,
        food_status: food_status,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${foodExits.food_name} vừa được cập nhật trạng thái`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update

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

      const deleted = await this.foodRestaurantRepo.remove({
        food_id: id,
        food_res_id: account.account_restaurant_id,
        deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${foodExits.food_name} vừa được chuyển vào thùng rác`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return deleted
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

      const restore = await this.foodRestaurantRepo.restore({
        food_id: id,
        food_res_id: account.account_restaurant_id,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })


      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${foodExits.food_name} vừa được khôi phục`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return restore

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

  async addFoodToCart({ food_id, id_user_guest }: { food_id: string; id_user_guest: string }): Promise<boolean> {
    try {
      const listFoodCart = await getCacheIO(`food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        await setCacheIO(`food_cart_${id_user_guest}`, [food_id])
        return true
      }
      if (listFoodCart.includes(food_id)) {
        return true
      }
      await setCacheIO(`food_cart_${id_user_guest}`, [...listFoodCart, food_id])
      return true
    } catch (error) {
      saveLogSystem({
        action: 'addFoodToCart',
        class: 'FoodRestaurantService',
        function: 'addFoodToCart',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodRestaurantCart(id_user_guest: string): Promise<FoodRestaurantEntity[]> {
    try {
      const listFoodCart = await getCacheIO(`food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        return []
      }
      const data = await this.foodRestaurantQuery.getFoodRestaurantByIds(listFoodCart)
      return data
    } catch (error) {
      saveLogSystem({
        action: 'getFoodRestaurantCart',
        class: 'FoodRestaurantService',
        function: 'getFoodRestaurantCart',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteFoodCart({ food_id, id_user_guest }: { food_id: string; id_user_guest: string }): Promise<boolean> {
    try {
      const listFoodCart = await getCacheIO(`food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        return false
      }
      const newListFoodCart = listFoodCart.filter((item) => item !== food_id)
      await setCacheIO(`food_cart_${id_user_guest}`, newListFoodCart)
      return true
    } catch (error) {
      saveLogSystem({
        action: 'deleteFoodCart',
        class: 'FoodRestaurantService',
        function: 'deleteFoodCart',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodRestaurantBySlug(slug: string): Promise<FoodRestaurantEntity> {
    try {
      const data = await this.foodRestaurantQuery.getFoodRestaurantBySlug(slug)
      data.fopt_food = await this.foodOptionQuery.findFoodOptionByIdFoodUI(data.food_id)
      return data
    } catch (error) {
      saveLogSystem({
        action: 'getFoodRestaurantBySlug',
        class: 'FoodRestaurantService',
        function: 'getFoodRestaurantBySlug',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodRestaurantById(food_id: string): Promise<FoodRestaurantEntity> {
    try {
      const data = await this.foodRestaurantQuery.getFoodRestaurantById({ food_id })
      if (!data) {
        throw new BadRequestError('Món ăn không tồn tại')
      }
      data.fopt_food = await this.foodOptionQuery.findFoodOptionByIdFoodUI(data.food_id)
      return data
    } catch (error) {
      saveLogSystem({
        action: 'getFoodRestaurantById',
        class: 'FoodRestaurantService',
        function: 'getFoodRestaurantById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllPaginationListFood({ pageSize, pageIndex }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: FoodRestaurantEntity[]
  }> {
    try {
      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodRestaurantQuery.findAllPaginationListFood({ pageSize, pageIndex })

      if (!dataFood?.result.length) {
        return {
          meta: {
            pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      return dataFood
    } catch (error) {
      saveLogSystem({
        action: 'findAllPaginationListFood',
        class: 'FoodRestaurantService',
        function: 'findAllPaginationListFood',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
  async extractMenuFromImage(imageBuffer: Buffer): Promise<{
    food_name: string
    food_price: number
    food_note: string
    food_description: string
  }[]> {
    const worker = await createWorker('eng+vie'); // Support both English and Vietnamese
    try {
      const { data: { text } } = await worker.recognize(imageBuffer);

      const prompt = `
Below is raw text extracted from a restaurant menu image via OCR, which may contain spelling errors or extra characters. Analyze and convert it into JSON format according to the following requirements:

1. Data normalization:
   - Dish name: Fix Vietnamese spelling errors (e.g., "mudng" to "muống", "nom" to "nộm"), capitalize the first letter of each word, remove extra characters like "wi", "wit", "&".
   - Price: Normalize to an integer (e.g., "50000" to 50000, "50,000 VND" to 50000). If unclear, set to null.
   - Description: If there's no clear information or only stray characters (e.g., "wi", "wd"), set to null. If meaning can be inferred, keep it concise.

2. JSON format:
   - Return an array of objects with the fields:
     - "name" (dish name, string),
     - "price" (price, number or null),
     - "description" (description, string or null).

3. Return only JSON, no explanations or markdown symbols.

Raw text:
${text}
    `;

      const menuData = await callGeminiAPI(prompt);

      if (!menuData) {
        await worker.terminate();
        return [];
      }

      let cleanedText = menuData
        .replace(/```json|```/g, '')
        .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '')
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        await worker.terminate();
        return [];
      }

      if (!Array.isArray(parsedData)) {
        console.error('❌ Returned data is not an array:', parsedData);
        await worker.terminate();
        return [];
      }

      const result: {
        food_name: string
        food_price: number
        food_note: string
        food_description: string
      }[] = parsedData.map((item: any) => ({
        food_name: typeof item.name === 'string' ? item.name : '',
        food_price: typeof item.price === 'number' ? item.price : 0,
        food_note: typeof item.description === 'string' ? item.description : '',
        food_description: typeof item.description === 'string' ? item.description : '',
      }));

      await worker.terminate();
      return result;
    } catch (error) {
      await worker.terminate();
      saveLogSystem({
        action: 'extractMenuFromImage',
        class: 'FoodRestaurantService',
        function: 'extractMenuFromImage',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      });
      throw new ServerErrorDefault(error);
    }
  }

}
