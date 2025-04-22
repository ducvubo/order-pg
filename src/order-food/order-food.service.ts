import { Injectable, OnModuleInit } from '@nestjs/common'
import { CreateOrderFoodDto } from './dto/create-order-food.dto'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { Between, DataSource, In, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from 'typeorm'
import { FoodRestaurantEntity } from 'src/food-restaurant/entities/food-restaurant.entity'
import { FoodOptionsEntity } from 'src/food-options/entities/food-options.entity'
import { FoodSnapEntity } from './entities/food-snap.entity'
import { OrderFoodEntity } from './entities/order-food.entity'
import { OrderFoodItemEntity } from './entities/order-food-item.entity'
import { sendMessageToKafka } from 'src/utils/kafka'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { InjectRepository } from '@nestjs/typeorm'
import { GetStatsDto } from './dto/get-stats.dto'
import kafkaInstance from '../config/kafka.config'

@Injectable()
export class OrderFoodService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderFoodEntity)
    private readonly orderFoodRepository: Repository<OrderFoodEntity>,
    @InjectRepository(OrderFoodItemEntity)
    private readonly orderFoodItemRepository: Repository<OrderFoodItemEntity>
  ) {}

  async onModuleInit() {
    const consumer = await kafkaInstance.getConsumer('SYNC_CLIENT_ID_ORDER_FOOD')
    await consumer.subscribe({ topic: 'SYNC_CLIENT_ID', fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const dataMessage = message.value.toString()
        const data = JSON.parse(dataMessage)
        const { clientIdOld, clientIdNew } = data
        this.sysncOrderFood(clientIdOld, clientIdNew).catch((error) => {
          saveLogSystem({
            action: 'sysncOrderFood',
            error: error,
            class: 'OrderFoodService',
            function: 'onModuleInit',
            message: error.message,
            time: new Date(),
            type: 'error'
          })
        })
      }
    })
  }

  async sysncOrderFood(clientIdOld: string, clientIdNew: string): Promise<void> {
    try {
      const orderFood = await this.orderFoodRepository.find({
        where: {
          id_user_guest: clientIdOld
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      await Promise.all(
        orderFood.map(async (item) => {
          item.id_user_guest = clientIdNew
          await this.orderFoodRepository.save(item)
        })
      )
    } catch (error) {
      saveLogSystem({
        action: 'sysncOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'sysncOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async createOrderFood(createOrderFoodDto: CreateOrderFoodDto, id_user_guest: string): Promise<OrderFoodEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const currentTime = new Date()
      currentTime.setHours(currentTime.getHours() + 7)

      const {
        od_res_id,
        od_user_address,
        od_user_district,
        od_user_email,
        od_user_name,
        od_user_note,
        od_user_phone,
        od_user_province,
        od_user_ward,
        od_user_id,
        od_price_shipping,
        od_type_shipping,
        order_food_items,
        od_link_confirm
      } = createOrderFoodDto

      //check món ăn
      const listIdFoodSnap: {
        food_id: string
        fsnp_id: string
      }[] = []
      await Promise.all(
        order_food_items.map(async (item) => {
          const food = await queryRunner.manager.findOne(FoodRestaurantEntity, {
            where: {
              food_id: item.food_id,
              food_res_id: od_res_id,
              food_state: In(['inStock', 'almostOut']),
              food_status: 'enable',
              isDeleted: 0
            }
          })

          if (!food) {
            throw new BadRequestError('Món ăn không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
          }

          // Kiểm tra thời gian phục vụ
          const [openHours, openMinutes] = food.food_open_time.split(':').map(Number)
          const [closeHours, closeMinutes] = food.food_close_time.split(':').map(Number)

          const openTime = new Date(currentTime)
          openTime.setHours(openHours, openMinutes, 0, 0)

          const closeTime = new Date(currentTime)
          closeTime.setHours(closeHours, closeMinutes, 0, 0)

          if (currentTime < openTime || currentTime > closeTime) {
            throw new BadRequestError(
              'Món ăn này không trong thời gian phục vụ hiện tại của nhà hàng, vui lòng thử lại sau'
            )
          }

          // Kiểm tra tùy chọn món ăn (nếu có)
          let listFoodOption: FoodOptionsEntity[] = []
          if (item.food_options?.length) {
            await Promise.all(
              item.food_options.map(async (option) => {
                const foodOption = await queryRunner.manager.findOne(FoodOptionsEntity, {
                  where: {
                    fopt_id: option,
                    fopt_food_id: item.food_id,
                    fopt_res_id: od_res_id,
                    fopt_state: In(['inStock', 'almostOut']),
                    fopt_status: 'enable',
                    isDeleted: 0
                  }
                })

                if (!foodOption) {
                  throw new BadRequestError('Tùy chọn không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
                }
                listFoodOption.push(foodOption)
              })
            )
          }

          const newFoodSnap = await queryRunner.manager.save(FoodSnapEntity, {
            food_id: item.food_id,
            fsnp_res_id: od_res_id,
            fsnp_name: food.food_name,
            fsnp_slug: food.food_slug,
            fsnp_description: food.food_description,
            fsnp_price: food.food_price,
            fsnp_image: food.food_image,
            fsnp_note: food.food_note,
            fsnp_options: JSON.stringify(listFoodOption)
          })

          listIdFoodSnap.push({
            food_id: item.food_id,
            fsnp_id: newFoodSnap.fsnp_id
          })
        })
      )

      const newOrderFood = await queryRunner.manager.save(OrderFoodEntity, {
        od_res_id,
        od_user_id,
        id_user_guest,
        od_user_name,
        od_user_phone,
        od_user_email,
        od_user_address,
        od_user_province,
        od_user_district,
        od_user_ward,
        od_user_note,
        od_price_shipping,
        od_type_shipping,
        od_status: 'waiting_confirm_customer',
        od_atribute: JSON.stringify([
          {
            type: 'Khách hàng đặt hàng',
            description: 'Khách hàng đã đặt hàng, vui lòng xác nhận đặt hàng trong vòng 10 phút',
            time: currentTime
          }
        ]),
        od_created_at: currentTime
      })

      await Promise.all(
        order_food_items.map(async (item) => {
          const quantity = Number(item.od_it_quantity)
          if (isNaN(quantity) || quantity < 0) {
            throw new BadRequestError(`Số lượng không hợp lệ cho món ăn ${item.food_id}`)
          }
          await queryRunner.manager.save(OrderFoodItemEntity, {
            od_res_id: od_res_id,
            od_id: newOrderFood.od_id,
            od_it_quantity: quantity,
            fsnp_id: listIdFoodSnap.find((food) => food.food_id === item.food_id)?.fsnp_id
          })
        })
      )

      const linkConfirm = `${od_link_confirm}?od_id=${newOrderFood.od_id}&od_res_id=${od_res_id}`
      console.log('linkConfirm', linkConfirm)
      sendMessageToKafka({
        topic: 'CREATE_ORDER_FOOD',
        message: JSON.stringify({
          to: od_user_email,
          subject: 'Xác nhận đơn hàng',
          text: `Bạn nhận được email này vì có một đơn hàng mới từ khách hàng ${od_user_name} với số điện thoại ${od_user_phone} và email ${od_user_email}. Vui lòng xác nhận đơn hàng trong vòng 10 phút. Để xác nhận đơn hàng, vui lòng nhấp vào liên kết bên dưới . Nếu bạn không phải là người nhận email này, vui lòng bỏ qua nó.`,
          link: linkConfirm
        })
      })

      await queryRunner.commitTransaction()
      return newOrderFood
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'createOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'createOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    } finally {
      await queryRunner.release()
    }
  }

  async guestConfirmOrderFood(od_id: string, od_res_id: string): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          od_status: 'waiting_confirm_customer'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      orderFood.od_status = 'waiting_confirm_restaurant'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng xác nhận đơn hàng',
          description: 'Khách hàng đã xác nhận đơn hàng, chờ nhà hàng xác nhận đơn hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestConfirmOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestConfirmOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestCancelOrderFood(
    od_id: string,
    od_res_id: string,
    od_reason_cancel: string,
    id_user_guest: string
  ): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest,
          od_status: In(['waiting_confirm_customer', 'waiting_confirm_restaurant', 'waiting_shipping'])
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể hủy đơn hàng')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể hủy đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể hủy đơn hàng')
      }

      orderFood.od_status = 'cancel_customer'
      orderFood.od_reason_cancel = od_reason_cancel
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng hủy đơn hàng',
          description: `Khách hàng đã hủy đơn hàng, lý do: ${od_reason_cancel}`,
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestCancelOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestCancelOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantConfirmOrderFood(od_id: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_status: 'waiting_confirm_restaurant'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFood.od_status = 'waiting_shipping'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng xác nhận đơn hàng',
          description: 'Nhà hàng đã xác nhận đơn hàng, chờ giao hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantConfirmOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantConfirmOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantConfirmShippingOrderFood(od_id: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_status: 'waiting_shipping'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFood.od_status = 'shipping'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng xác nhận đang giao hàng',
          description: 'Nhà hàng đã xác nhận đang giao hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantConfirmShippingOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantConfirmShippingOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  // delivered_customer
  async restaurantDeliveredOrderFood(od_id: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_status: 'shipping'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFood.od_status = 'delivered_customer'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng xác nhận đã giao hàng đến khách hàng',
          description: 'Nhà hàng đã xác nhận đã giao hàng đến khách hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantDeliveredOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantDeliveredOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  //customer_unreachable
  async restaurantCustomerUnreachableOrderFood(od_id: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_status: 'shipping'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'customer_unreachable') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFood.od_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFood.od_status = 'customer_unreachable'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng xác nhận khách hàng không liên lạc được',
          description: 'Nhà hàng đã xác nhận khách hàng không liên lạc được',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCustomerUnreachableOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantCustomerUnreachableOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantCancelOrderFood(
    od_id: string,
    od_reason_cancel: string,
    account: IAccount
  ): Promise<OrderFoodEntity> {
    try {
      if (!od_reason_cancel) {
        throw new BadRequestError('Lý do hủy đơn hàng không được để trống')
      }
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_status: In(['waiting_confirm_restaurant', 'waiting_shipping'])
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể hủy đơn hàng')
      }

      if (orderFood.od_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể hủy đơn hàng')
      }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể hủy đơn hàng')
      }

      orderFood.od_status = 'cancel_restaurant'
      orderFood.od_reason_cancel = od_reason_cancel
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng hủy đơn hàng',
          description: `Nhà hàng đã hủy đơn hàng, lý do: ${od_reason_cancel}`,
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCancelOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantCancelOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestReceivedOrderFood(od_id: string, od_res_id: string, id_user_guest: string): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest,
          od_status: 'delivered_customer'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      // if (orderFood.od_status === 'delivered_customer') {
      //   throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng');
      // }

      if (orderFood.od_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      orderFood.od_status = 'received_customer'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng xác nhận đã nhận đơn hàng',
          description: 'Khách hàng đã xác nhận đã nhận đơn hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestReceivedOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestReceivedOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestComplaintOrderFood(
    od_id: string,
    od_res_id: string,
    id_user_guest: string,
    complaint: string
  ): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest,
          od_status: 'received_customer'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'complaint') {
        throw new BadRequestError('Đơn hàng đã khiếu nại, không thể khiếu nại đơn hàng')
      }

      if (orderFood.od_status === 'complaint_done') {
        throw new BadRequestError('Đơn hàng đã khiếu nại và đã được giải quyết, không thể khiếu nại đơn hàng')
      }

      orderFood.od_status = 'complaint'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng khiếu nại đơn hàng',
          description: `Khách hàng đã khiếu nại đơn hàng`,
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestComplaintOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestComplaintOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestComplaintDoneOrderFood(od_id: string, od_res_id: string, id_user_guest: string): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest,
          od_status: 'complaint'
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_status === 'complaint_done') {
        throw new BadRequestError('Đơn hàng đã khiếu nại và đã được giải quyết, không thể khiếu nại đơn hàng')
      }

      orderFood.od_status = 'complaint_done'
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng xác nhận đã giải quyết khiếu nại',
          description: 'Khách hàng đã xác nhận đã giải quyết khiếu nại',
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestComplaintDoneOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestComplaintDoneOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestFeedbackOrderFood(
    od_id: string,
    od_res_id: string,
    id_user_guest: string,
    od_feed_star: 1 | 2 | 3 | 4 | 5,
    od_feed_content: string
  ): Promise<OrderFoodEntity> {
    try {
      if (!od_feed_star) {
        throw new BadRequestError('Bạn chưa đánh giá đơn hàng, vui lòng thử lại sau')
      }
      if (!od_feed_content) {
        throw new BadRequestError('Bạn chưa nhập nội dung đánh giá đơn hàng, vui lòng thử lại sau')
      }
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest,
          od_status: In(['complaint_done', 'received_customer'])
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFood.od_feed_star) {
        throw new BadRequestError('Đơn hàng đã được đánh giá, không thể đánh giá lại đơn hàng')
      }

      if (orderFood.od_status === 'complaint') {
        throw new BadRequestError('Đơn hàng đang khiếu nại, không thể đánh giá đơn hàng')
      }

      if (orderFood.od_status === 'waiting_confirm_customer')
        throw new BadRequestError('Đơn hàng đang chờ xác nhận, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'waiting_confirm_restaurant')
        throw new BadRequestError('Đơn hàng đang chờ xác nhận, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'waiting_shipping')
        throw new BadRequestError('Đơn hàng đang chờ giao hàng, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'shipping')
        throw new BadRequestError('Đơn hàng đang giao hàng, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'delivered_customer')
        throw new BadRequestError('Đơn hàng đã giao hàng, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'cancel_customer')
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể đánh giá đơn hàng')
      if (orderFood.od_status === 'cancel_restaurant')
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể đánh giá đơn hàng')

      orderFood.od_feed_star = od_feed_star
      orderFood.od_feed_content = od_feed_content
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Khách hàng đánh giá đơn hàng',
          description: `Khách hàng đã đánh giá đơn hàng với ${od_feed_star} sao và nội dung là ${od_feed_content}`,
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'guestFeedbackOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'guestFeedbackOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantFeedbackOrderFood(od_id: string, od_feed_reply: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      if (!od_feed_reply) {
        throw new BadRequestError('Bạn chưa nhập nội dung phản hồi đơn hàng, vui lòng thử lại sau')
      }
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id,
          od_feed_star: In([1, 2, 3, 4, 5]),
          od_feed_reply: null
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (!orderFood.od_feed_star) {
        throw new BadRequestError('Đơn hàng chưa được đánh giá, không thể phản hồi đơn hàng')
      }

      if (orderFood.od_feed_reply) {
        throw new BadRequestError('Đơn hàng đã được phản hồi, không thể phản hồi lại đơn hàng')
      }

      orderFood.od_feed_reply = od_feed_reply
      orderFood.od_atribute = JSON.stringify([
        ...JSON.parse(orderFood.od_atribute),
        {
          type: 'Nhà hàng phản hồi đánh giá của khách hàng',
          description: `Nhà hàng đã phản hồi đánh giá của khách hàng với nội dung là ${od_feed_reply}`,
          time: new Date()
        }
      ])

      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantFeedbackOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantFeedbackOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantUpdateViewFeedbackOrderFood(
    od_id: string,
    od_feed_view: 'active' | 'disable',
    account: IAccount
  ): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (!orderFood.od_feed_star) {
        throw new BadRequestError('Đơn hàng chưa được đánh giá, không thể phản hồi đơn hàng')
      }

      if (!orderFood.od_feed_reply) {
        throw new BadRequestError('Đơn hàng chưa được phản hồi, không thể cập nhật trạng thái')
      }

      orderFood.od_feed_view = od_feed_view
      return await this.orderFoodRepository.save(orderFood)
    } catch (error) {
      saveLogSystem({
        action: 'restaurantUpdateViewFeedbackOrderFood',
        error: error,
        class: 'OrderFoodService',
        function: 'restaurantUpdateViewFeedbackOrderFood',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListOrderFoodRestaurantPagination(
    {
      fromDate,
      keyword,
      od_status,
      pageIndex,
      pageSize = 10,
      toDate
    }: {
      pageSize?: number
      pageIndex: number
      keyword: string
      od_status:
        | 'waiting_confirm_customer'
        | 'over_time_customer'
        | 'waiting_confirm_restaurant'
        | 'waiting_shipping'
        | 'shipping'
        | 'delivered_customer'
        | 'received_customer'
        | 'cancel_customer'
        | 'cancel_restaurant'
        | 'complaint'
        | 'complaint_done'
        | 'all'
      toDate: string
      fromDate: string
    },
    account: IAccount
  ): Promise<ResultPagination<OrderFoodEntity>> {
    try {
      const whereConditions: any = {
        od_res_id: account.account_restaurant_id
      }

      if (od_status !== 'all') {
        whereConditions.od_status = od_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          whereConditions.od_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          whereConditions.od_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          whereConditions.od_created_at = LessThanOrEqual(to)
        }
      }

      if (keyword) {
        whereConditions.od_user_name = Like(`%${keyword}%`)
        whereConditions.od_user_phone = Like(`%${keyword}%`)
        whereConditions.od_user_email = Like(`%${keyword}%`)
        whereConditions.od_user_address = Like(`%${keyword}%`)
        whereConditions.od_user_note = Like(`%${keyword}%`)
      }

      const orderFood = await this.orderFoodRepository.find({
        where: whereConditions,
        order: {
          od_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['orderItems', 'orderItems.foodSnap']
      })

      const total = await this.orderFoodRepository.count({
        where: whereConditions
      })

      const totalPage = Math.ceil(total / pageSize)
      const result: ResultPagination<OrderFoodEntity> = {
        meta: {
          current: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: orderFood
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListOrderFoodRestaurantPagination',
        error: error,
        class: 'OrderFoodService',
        function: 'getListOrderFoodRestaurantPagination',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListOrderFoodGuestPagination({
    id_user_guest,
    toDate,
    fromDate,
    keyword,
    od_status,
    pageIndex,
    pageSize = 10
  }: {
    id_user_guest: string
    pageSize?: number
    pageIndex: number
    keyword: string
    od_status:
      | 'waiting_confirm_customer'
      | 'over_time_customer'
      | 'waiting_confirm_restaurant'
      | 'waiting_shipping'
      | 'shipping'
      | 'delivered_customer'
      | 'received_customer'
      | 'cancel_customer'
      | 'cancel_restaurant'
      | 'complaint'
      | 'complaint_done'
      | 'all'
    toDate: string
    fromDate: string
  }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalItem: number
      totalPage: number
    }
    result: OrderFoodEntity[]
  }> {
    try {
      const whereConditions: any = {
        id_user_guest
      }

      if (od_status !== 'all') {
        whereConditions.od_status = od_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          whereConditions.od_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          whereConditions.od_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          whereConditions.od_created_at = LessThanOrEqual(to)
        }
      }

      if (keyword) {
        whereConditions.od_user_name = Like(`%${keyword}%`)
        whereConditions.od_user_phone = Like(`%${keyword}%`)
        whereConditions.od_user_email = Like(`%${keyword}%`)
        whereConditions.od_user_address = Like(`%${keyword}%`)
        whereConditions.od_user_note = Like(`%${keyword}%`)
      }

      const orderFood = await this.orderFoodRepository.find({
        where: whereConditions,
        order: {
          od_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['orderItems', 'orderItems.foodSnap']
      })

      const total = await this.orderFoodRepository.count({
        where: whereConditions
      })

      const totalPage = Math.ceil(total / pageSize)
      const result: {
        meta: {
          pageIndex: number
          pageSize: number
          totalItem: number
          totalPage: number
        }
        result: OrderFoodEntity[]
      } = {
        meta: {
          pageIndex: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: orderFood
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListOrderFoodGuestPagination',
        error: error,
        class: 'OrderFoodService',
        function: 'getListOrderFoodGuestPagination',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getOrderFoodByIdByGuest(od_id: string, od_res_id: string, id_user_guest: string): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id,
          id_user_guest
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      return orderFood
    } catch (error) {
      saveLogSystem({
        action: 'getOrderFoodByIdByGuest',
        error: error,
        class: 'OrderFoodService',
        function: 'getOrderFoodByIdByGuest',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getOrderFoodById(od_id: string, account: IAccount): Promise<OrderFoodEntity> {
    try {
      const orderFood = await this.orderFoodRepository.findOne({
        where: {
          od_id,
          od_res_id: account.account_restaurant_id
        }
      })

      if (!orderFood) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      return orderFood
    } catch (error) {
      saveLogSystem({
        action: 'getOrderFoodById',
        error: error,
        class: 'OrderFoodService',
        function: 'getOrderFoodById',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  private buildDateFilter(dto: GetStatsDto) {
    const { startDate, endDate } = dto
    if (!startDate && !endDate) return undefined
    return Between(startDate ? new Date(startDate) : new Date(0), endDate ? new Date(endDate) : new Date())
  }

  async getTotalRevenue(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodSnap', 'foodSnap')
      .where('order.od_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_status = :status', { status: 'received_customer' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .getMany()

    const totalRevenue = orders.reduce((sum, order) => {
      const orderTotal = order.orderItems.reduce((itemSum, item) => {
        return itemSum + item.od_it_quantity * item.foodSnap.fsnp_price
      }, 0)
      return sum + orderTotal
    }, 0)

    return { totalRevenue }
  }

  // API 2: Revenue Trends (Daily)
  async getRevenueTrends(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodSnap', 'foodSnap')
      .where('order.od_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_type_shipping = :status', { status: 'GHTK' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .getMany()

    const trendsMap = new Map<string, number>()
    orders.forEach((order) => {
      const date = order.od_created_at.toISOString().split('T')[0]
      const orderTotal = order.orderItems.reduce((sum, item) => {
        return sum + item.od_it_quantity * item.foodSnap.fsnp_price
      }, 0)
      trendsMap.set(date, (trendsMap.get(date) || 0) + orderTotal)
    })

    const trends = Array.from(trendsMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return trends // Format: [{ date: '2025-04-01', revenue: 12000000 }, ...]
  }

  // API 3: Top Online Foods
  async getTopFoods(dto: GetStatsDto, account: IAccount) {
    const items = await this.orderFoodItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.foodSnap', 'foodSnap')
      .where('order.od_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_type_shipping = :status', { status: 'GHTK' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .groupBy('foodSnap.fsnp_id, foodSnap.fsnp_name')
      .select([
        'foodSnap.fsnp_name AS name',
        'SUM(item.od_it_quantity) AS orders',
        'SUM(item.od_it_quantity * foodSnap.fsnp_price) AS revenue'
      ])
      .orderBy('orders', 'DESC')
      .limit(5)
      .getRawMany()

    const data = items.map((item) => ({
      name: item.NAME,
      orders: parseInt(item.ORDERS),
      revenue: parseFloat(item.REVENUE)
    })) // Format: [{ name: 'Phở bò online', orders: 120, revenue: 3600000 }, ...]
    return data
  }

  // API 4: Recent Online Orders
  async getRecentOrders(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodSnap', 'foodSnap')
      .where('order.od_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .orderBy('order.od_created_at', 'DESC')
      .take(5)
      .getMany()

    const data = orders.map((order) => ({
      id: order.od_id,
      customer: order.od_user_name || 'Khách vãng lai',
      total: order.orderItems.reduce((sum, item) => {
        return sum + item.od_it_quantity * item.foodSnap.fsnp_price
      }, 0),
      status: {
        waiting_confirm_customer: 'Chờ xác nhận khách hàng',
        over_time_customer: 'Quá hạn xác nhận',
        waiting_confirm_restaurant: 'Chờ nhà hàng xác nhận',
        waiting_shipping: 'Chờ giao hàng',
        shipping: 'Đang giao hàng',
        delivered_customer: 'Đã giao hàng',
        received_customer: 'Hoàn thành',
        cancel_customer: 'Khách hủy',
        cancel_restaurant: 'Nhà hàng hủy',
        complaint: 'Khiếu nại',
        complaint_done: 'Khiếu nại xong'
      }[order.od_status]
    }))

    return data
  }

  // API 5: Order Status Distribution
  async getOrderStatusDistribution(dto: GetStatsDto, account: IAccount) {
    const statuses = await this.orderFoodRepository
      .createQueryBuilder('order')
      .where('order.od_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .groupBy('order.od_status')
      .select(['order.od_status AS status', 'COUNT(*) AS count'])
      .getRawMany()

    const data = statuses.map((s) => ({
      type:
        {
          waiting_confirm_customer: 'Chờ xác nhận khách hàng',
          over_time_customer: 'Quá hạn xác nhận',
          waiting_confirm_restaurant: 'Chờ nhà hàng xác nhận',
          waiting_shipping: 'Chờ giao hàng',
          shipping: 'Đang giao hàng',
          delivered_customer: 'Đã giao hàng',
          received_customer: 'Hoàn thành',
          cancel_customer: 'Khách hủy',
          cancel_restaurant: 'Nhà hàng hủy',
          complaint: 'Khiếu nại',
          complaint_done: 'Khiếu nại xong'
        }[s.STATUS] || s.STATUS,
      value: parseInt(s.COUNT)
    }))

    return data
  }
}
