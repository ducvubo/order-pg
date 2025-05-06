import { Injectable, OnModuleInit } from '@nestjs/common'
import { FoodComboResRepo } from './entities/food-combo-res.repo'
import { FoodComboResQuery } from './entities/food-combo-res.query'
import { CreateFoodComboResDto, FoodItemDto } from './dto/create-food-combo-res.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { FoodComboItemsQuery } from 'src/food-combo-items/entities/food-combo-items.query'
import { FoodComboItemsRepo } from 'src/food-combo-items/entities/food-combo-items.repo'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { DataSource, UpdateResult } from 'typeorm'
import slugify from 'slugify'
import { FoodComboResEntity } from './entities/combo-food-res.entity'
import { FoodComboItemsEntity } from 'src/food-combo-items/entities/food-combo-items.entity'
import { UpdateFoodComboResDto } from './dto/update-food-combo-res.dto'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateStatusFoodComboResDto } from './dto/update-status-food-combo-res.dto'
import { UpdateStateFoodComboResDto } from './dto/update-state-food-combo-res.dto'
import { FoodRestaurantQuery } from 'src/food-restaurant/entities/food-restaurant.query'
import { getCacheIO, setCacheIO } from 'src/utils/cache'
import kafkaInstance from '../config/kafka.config'
import { sendMessageToKafka } from 'src/utils/kafka'
import { generateSlug } from 'src/utils'

@Injectable()
export class ComboFoodResService implements OnModuleInit {
  constructor(
    private readonly foodComboResRepo: FoodComboResRepo,
    private readonly foodComboResQuery: FoodComboResQuery,
    private readonly foodComboItemsQuery: FoodComboItemsQuery,
    private readonly foodComboItemsRepo: FoodComboItemsRepo,
    private readonly foodRestaurantQuery: FoodRestaurantQuery,
    private readonly dataSource: DataSource
  ) { }

  async onModuleInit() {
    const consumer = await kafkaInstance.getConsumer('SYNC_CLIENT_ID_CART_FOOD_COMBO')
    await consumer.subscribe({ topic: 'SYNC_CLIENT_ID', fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const dataMessage = message.value.toString()
        const data = JSON.parse(dataMessage)
        const { clientIdOld, clientIdNew } = data
        //đồng bộ rỏ hàng
        const listFoodCartComboOld = await getCacheIO(`combo_food_cart_${clientIdOld}`)
        const listFoodCartComboNew = await getCacheIO(`combo_food_cart_${clientIdOld}`)
        const listFoodCartCombo = []
        if (listFoodCartComboOld) {
          listFoodCartCombo.push(...listFoodCartComboOld)
        }
        if (listFoodCartComboNew) {
          listFoodCartCombo.push(...listFoodCartComboNew)
        }
        await setCacheIO(`combo_food_cart_${clientIdNew}`, listFoodCartCombo)
      }
    })
  }

  async createComboFoodRes(
    createFoodComboResDto: CreateFoodComboResDto,
    account: IAccount
  ): Promise<FoodComboResEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      // kiểm tra danh sách món ăn trong combo
      const {
        fcb_description,
        fcb_image,
        fcb_name,
        fcb_note,
        fcb_price,
        fcb_sort,
        fcb_close_time,
        food_items,
        fcb_open_time
      } = createFoodComboResDto

      await Promise.all(
        food_items.map(async (item: FoodItemDto) => {
          const foodComboItem = await this.foodRestaurantQuery.findOne(item.food_id, account)
          if (!foodComboItem) {
            throw new BadRequestError(`Món ăn không tồn tại`)
          }
        })
      )

      const slug = generateSlug(fcb_name)

      // tạo combo
      const combo = await queryRunner.manager.save(FoodComboResEntity, {
        fcb_description,
        fcb_image,
        fcb_slug: slug,
        fcb_name,
        fcb_note,
        fcb_price,
        fcb_sort,
        fcb_close_time,
        fcb_open_time,
        fcb_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      // tạo danh sách món ăn trong combo
      const savePromises = food_items.map((item) => {
        return queryRunner.manager.save(FoodComboItemsEntity, {
          fcbi_combo_id: combo.fcb_id,
          fcbi_food_id: item.food_id,
          fcbi_quantity: item.food_quantity,
          fcbi_res_id: account.account_restaurant_id,
          createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
      })

      await Promise.all(savePromises)


      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${createFoodComboResDto.fcb_name} vừa được tạo mới`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await queryRunner.commitTransaction()
      return combo
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'CreateComboFoodRes',
        class: 'ComboFoodResService',
        function: 'createComboFoodRes',
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

  async updateComboFoodRes(updateFoodComboResDto: UpdateFoodComboResDto, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const {
        fcb_id,
        food_items,
        fcb_description,
        fcb_image,
        fcb_name,
        fcb_note,
        fcb_price,
        fcb_sort,
        fcb_open_time,
        fcb_close_time
      } = updateFoodComboResDto

      // Lấy combo hiện tại
      const existingCombo = await this.foodComboResQuery.findOne(fcb_id, account.account_restaurant_id)
      if (!existingCombo) {
        throw new BadRequestError('Combo không tồn tại')
      }

      const listItemOdl = await this.foodComboItemsQuery.findByComboId(fcb_id, account.account_restaurant_id)

      for (const item of listItemOdl) {
        await queryRunner.manager.remove(FoodComboItemsEntity, {
          fcbi_id: item.fcbi_id
        })
      }

      const savePromises = food_items.map((newItem) => {
        return queryRunner.manager.save(FoodComboItemsEntity, {
          fcbi_combo_id: fcb_id,
          fcbi_food_id: newItem.food_id,
          fcbi_quantity: newItem.food_quantity,
          fcbi_res_id: account.account_restaurant_id,
          createdBy: account.account_employee_id || account.account_restaurant_id
        })
      })

      await Promise.all(savePromises)

      // Cập nhật thông tin combo
      const slug = slugify(fcb_name, { lower: true, strict: true })
      const update = await queryRunner.manager
        .createQueryBuilder()
        .update(FoodComboResEntity)
        .set({
          fcb_id,
          fcb_description,
          fcb_image,
          fcb_slug: slug,
          fcb_name,
          fcb_note,
          fcb_price,
          fcb_sort,
          fcb_close_time,
          fcb_open_time,
          updatedAt: new Date(),
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({ fcb_id, fcb_res_id: account.account_restaurant_id })
        .execute()

      await queryRunner.commitTransaction()

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${updateFoodComboResDto.fcb_name} vừa được cập nhật`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'UpdateComboFoodRes',
        class: 'ComboFoodResService',
        function: 'updateComboFoodRes',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault('Lỗi hệ thống, vui lòng thử lại sau!')
    } finally {
      await queryRunner.release()
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      fcb_name
    }: {
      pageSize: number
      pageIndex: number
      fcb_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<FoodComboResEntity>> {
    try {
      if (!fcb_name && typeof fcb_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataCombo = await this.foodComboResQuery.findAllPagination(
        { pageSize, pageIndex, fcb_name, isDeleted: 0 },
        account
      )

      if (!dataCombo?.result.length) {
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

      return dataCombo
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
      fcb_name
    }: {
      pageSize: number
      pageIndex: number
      fcb_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<FoodComboResEntity>> {
    try {
      if (!fcb_name && typeof fcb_name !== 'string') {
        throw new BadRequestError('Món ăn không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataCombo = await this.foodComboResQuery.findAllPagination(
        { pageSize, pageIndex, fcb_name, isDeleted: 1 },
        account
      )

      if (!dataCombo?.result.length) {
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

      return dataCombo
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

  async deleteComboFoodRes(fcb_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const combo = await this.foodComboResQuery.findOne(fcb_id, account.account_restaurant_id)
      if (!combo) {
        throw new BadRequestError('Combo không tồn tại')
      }

      const deleted = await this.foodComboResRepo.deleteComboFoodRes(fcb_id, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${combo.fcb_name} vừa được xóa`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return deleted

    } catch (error) {
      saveLogSystem({
        action: 'deleteComboFoodRes',
        class: 'ComboFoodResService',
        function: 'deleteComboFoodRes',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreComboFoodRes(fcb_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const combo = await this.foodComboResQuery.findOne(fcb_id, account.account_restaurant_id)
      if (!combo) {
        throw new BadRequestError('Combo không tồn tại')
      }

      const restore = await this.foodComboResRepo.restoreComboFoodRes(fcb_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${combo.fcb_name} vừa được khôi phục`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreComboFoodRes',
        class: 'ComboFoodResService',
        function: 'restoreComboFoodRes',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusComboFoodRes(
    updateStatusFoodComboResDto: UpdateStatusFoodComboResDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const combo = await this.foodComboResQuery.findOne(
        updateStatusFoodComboResDto.fcb_id,
        account.account_restaurant_id
      )
      if (!combo) {
        throw new BadRequestError('Combo không tồn tại')
      }

      const update = await this.foodComboResRepo.updateStatusComboFoodRes(updateStatusFoodComboResDto, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${combo.fcb_name} vừa được cập nhật trạng thái`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusComboFoodRes',
        class: 'ComboFoodResService',
        function: 'updateStatusComboFoodRes',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStateComboFoodRes(
    updateStateFoodComboResDto: UpdateStateFoodComboResDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const combo = await this.foodComboResQuery.findOne(
        updateStateFoodComboResDto.fcb_id,
        account.account_restaurant_id
      )
      if (!combo) {
        throw new BadRequestError('Combo không tồn tại')
      }
      const update = await this.foodComboResRepo.updateStateComboFoodRes(updateStateFoodComboResDto, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Combo món ăn ${combo.fcb_name} vừa được cập nhật trạng thái`,
          noti_title: `Combo món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStateComboFoodRes',
        class: 'ComboFoodResService',
        function: 'updateStateComboFoodRes',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(
    fcb_id: string,
    account: IAccount
  ): Promise<FoodComboResEntity & { food_items: { food_id: string; food_quantity: number }[] }> {
    try {
      const result = await this.foodComboResQuery.findOne(fcb_id, account.account_restaurant_id)

      if (!result) {
        throw new BadRequestError('Combo không tồn tại')
      }

      const listComboItems = await this.foodComboItemsQuery.findByComboId(fcb_id, account.account_restaurant_id)

      const extendedResult = {
        ...result,
        food_items: listComboItems.map((item) => ({
          food_id: item.fcbi_food_id,
          food_quantity: item.fcbi_quantity
        }))
      }

      return extendedResult
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'ComboFoodResService',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findComboFoodRestaurants(combo_food_res_id: string): Promise<FoodComboResEntity[]> {
    try {
      return await this.foodComboResQuery.findComboFoodRestaurants(combo_food_res_id)
    } catch (error) {
      saveLogSystem({
        action: 'findComboFoodRestaurants',
        class: 'ComboFoodResService',
        function: 'findComboFoodRestaurants',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async addComboFoodToCart({ fcb_id, id_user_guest }: { fcb_id: string; id_user_guest: string }): Promise<boolean> {
    try {
      const listFoodCart = await getCacheIO(`combo_food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        await setCacheIO(`combo_food_cart_${id_user_guest}`, [fcb_id])
        return true
      }
      if (listFoodCart.includes(fcb_id)) {
        return true
      }
      await setCacheIO(`combo_food_cart_${id_user_guest}`, [...listFoodCart, fcb_id])
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

  async getCartFoodCombo(id_user_guest: string): Promise<FoodComboResEntity[]> {
    try {
      const listFoodCart = await getCacheIO(`combo_food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        return []
      }
      const listComboFood = await this.foodComboResQuery.getFoodComboResByIds(listFoodCart)
      if (!listComboFood) {
        return []
      }
      await Promise.all(
        listComboFood.map(async (item) => {
          item.fcbi_combo = await this.foodComboItemsQuery.getComboItemByIdComboIdWithUI(item.fcb_id)
        })
      )

      return listComboFood
    } catch (error) {
      saveLogSystem({
        action: 'getCartFood',
        class: 'FoodRestaurantService',
        function: 'getCartFood',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteComboFoodToCart({ fcb_id, id_user_guest }: { fcb_id: string; id_user_guest: string }): Promise<boolean> {
    try {
      const listFoodCart = await getCacheIO(`combo_food_cart_${id_user_guest}`)
      if (!listFoodCart) {
        return false
      }
      const newListFoodCart = listFoodCart.filter((item) => item !== fcb_id)
      await setCacheIO(`combo_food_cart_${id_user_guest}`, newListFoodCart)
      return true
    } catch (error) {
      saveLogSystem({
        action: 'deleteComboFoodToCart',
        class: 'FoodRestaurantService',
        function: 'deleteComboFoodToCart',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodComboBySlug(fcb_slug: string): Promise<FoodComboResEntity> {
    try {
      const foodCombo = await this.foodComboResQuery.getFoodComboResBySlug(fcb_slug)

      foodCombo.fcbi_combo = await this.foodComboItemsQuery.getComboItemByIdComboIdWithUI(foodCombo.fcb_id)

      return foodCombo
    } catch (error) {
      saveLogSystem({
        action: 'getFoodComboBySlug',
        class: 'ComboFoodResService',
        function: 'getFoodComboBySlug',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodComboById(fcb_id: string): Promise<FoodComboResEntity> {
    try {
      const foodCombo = await this.foodComboResQuery.getFoodComboResById(fcb_id)

      foodCombo.fcbi_combo = await this.foodComboItemsQuery.getComboItemByIdComboIdWithUI(foodCombo.fcb_id)

      return foodCombo
    } catch (error) {
      saveLogSystem({
        action: 'getFoodComboById',
        class: 'ComboFoodResService',
        function: 'getFoodComboById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  // async findAllPaginationListFood({ pageSize, pageIndex }): Promise<{
  //   meta: {
  //     pageIndex: number
  //     pageSize: number
  //     totalPage: number
  //     totalItem: number
  //   }
  //   result: FoodRestaurantEntity[]
  // }> {
  //   try {
  //     pageIndex = isNaN(pageIndex) ? 0 : pageIndex
  //     pageSize = isNaN(pageSize) ? 10 : pageSize

  //     const dataFood = await this.foodRestaurantQuery.findAllPaginationListFood({ pageSize, pageIndex })

  //     if (!dataFood?.result.length) {
  //       return {
  //         meta: {
  //           pageIndex,
  //           pageSize,
  //           totalPage: 0,
  //           totalItem: 0
  //         },
  //         result: []
  //       }
  //     }

  //     return dataFood
  //   } catch (error) {
  //     saveLogSystem({
  //       action: 'findAllPaginationListFood',
  //       class: 'FoodRestaurantService',
  //       function: 'findAllPaginationListFood',
  //       message: error.message,
  //       time: new Date(),
  //       error: error,
  //       type: 'error'
  //     })
  //     throw new ServerErrorDefault(error)
  //   }
  // }

  async findAllPaginationListFoodCombo({ pageSize, pageIndex }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: FoodComboResEntity[]
  }> {
    try {
      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.foodComboResQuery.findAllPaginationListFoodCombo({ pageSize, pageIndex })

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
        action: 'findAllPaginationListFoodCombo',
        class: 'ComboFoodResService',
        function: 'findAllPaginationListFoodCombo',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
