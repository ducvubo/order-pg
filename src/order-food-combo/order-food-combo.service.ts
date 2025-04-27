import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FoodComboResEntity } from 'src/combo-food-res/entities/combo-food-res.entity'
import { FoodComboItemsEntity } from 'src/food-combo-items/entities/food-combo-items.entity'
import { FoodRestaurantEntity } from 'src/food-restaurant/entities/food-restaurant.entity'
import { Between, DataSource, In, LessThanOrEqual, Like, MoreThanOrEqual, Repository } from 'typeorm'
import { OrderFoodComboEntity } from './entities/order-food-combo.entity'
import { OrderFoodComboItemEntity } from './entities/order-food-combo-item.entity'
import { FoodComboSnapEntity } from './entities/food-combo-snap.entity'
import { CreateOrderFoodComboDto } from './dto/create-order-food-combo.dto'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { sendMessageToKafka } from 'src/utils/kafka'
import { text } from 'stream/consumers'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { GetStatsDto } from 'src/order-food/dto/get-stats.dto'
import kafkaInstance from '../config/kafka.config'

//WAITING TIME REFACTOR CODE
@Injectable()
export class OrderFoodComboService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderFoodComboEntity)
    private readonly orderFoodComboRepository: Repository<OrderFoodComboEntity>,
    @InjectRepository(OrderFoodComboItemEntity)
    private readonly orderFoodComboItemRepository: Repository<OrderFoodComboItemEntity>
  ) { }

  async onModuleInit() {
    const consumer = await kafkaInstance.getConsumer('SYNC_CLIENT_ID_ORDER_FOOD_COMBO')
    await consumer.subscribe({ topic: 'SYNC_CLIENT_ID', fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const dataMessage = message.value.toString()
        const data = JSON.parse(dataMessage)
        const { clientIdOld, clientIdNew } = data
        this.syncClientIdOrderFoodCombo(clientIdOld, clientIdNew).catch((error) => {
          saveLogSystem({
            action: 'syncClientIdOrderFoodCombo',
            error: error,
            class: 'OrderFoodComboService',
            function: 'syncClientIdOrderFoodCombo',
            message: error.message,
            time: new Date(),
            type: 'error'
          })
        })
      }
    })
  }

  async syncClientIdOrderFoodCombo(clientIdOld: string, clientIdNew: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const orderFoodCombo = await queryRunner.manager.find(OrderFoodComboEntity, {
        where: {
          id_user_guest: clientIdOld
        }
      })

      if (orderFoodCombo.length > 0) {
        await Promise.all(
          orderFoodCombo.map(async (item) => {
            item.id_user_guest = clientIdNew
            await queryRunner.manager.save(item)
          })
        )
      }
      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'syncClientIdOrderFoodCombo',
        error: error,
        class: 'OrderFoodComboService',
        function: 'syncClientIdOrderFoodCombo',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    } finally {
      await queryRunner.release()
    }
  }

  async createOrderFoodCombo(
    createOrderFoodComboDto: CreateOrderFoodComboDto,
    id_user_guest: string
  ): Promise<OrderFoodComboEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()
      const currentTime = new Date()
      // currentTime.setHours(currentTime.getHours() + 7);

      const {
        od_cb_res_id,
        od_cb_user_name,
        od_cb_user_phone,
        od_cb_user_email,
        od_cb_user_address,
        od_cb_user_province,
        od_cb_user_district,
        od_cb_user_ward,
        od_cb_user_note,
        od_cb_link_confirm,
        od_cb_price_shipping,
        od_cb_type_shipping,
        od_cb_user_id,
        order_food_combo_items
      } = createOrderFoodComboDto

      //snap combo
      const listComboSnap: { fcb_id: string; fcb_snp_id: string }[] = []
      await Promise.all(
        order_food_combo_items.map(async (item) => {
          const combo = await queryRunner.manager.findOne(FoodComboResEntity, {
            where: {
              fcb_id: item.fcb_id,
              fcb_res_id: od_cb_res_id,
              fcb_status: 'enable'
            },
            relations: ['fcbi_combo', 'fcbi_combo.fcbi_food']
          })
          if (!combo) {
            throw new BadRequestError('Combo món ăn không tồn tại')
          }

          const [openHours, openMinutes] = combo.fcb_open_time.split(':').map(Number)
          const [closeHours, closeMinutes] = combo.fcb_close_time.split(':').map(Number)

          const openTime = new Date(currentTime)
          openTime.setHours(openHours, openMinutes, 0, 0)

          const closeTime = new Date(currentTime)
          closeTime.setHours(closeHours, closeMinutes, 0, 0)

          if (currentTime < openTime || currentTime > closeTime) {
            throw new BadRequestError(
              'Combo món ăn này không trong thời gian phục vụ hiện tại của nhà hàng, vui lòng thử lại sau'
            )
          }

          const newComboSnap = await queryRunner.manager.save(FoodComboSnapEntity, {
            fcb_id: combo.fcb_id,
            fcb_snp_res_id: combo.fcb_res_id,
            fcb_snp_name: combo.fcb_name,
            fcb_snp_slug: combo.fcb_slug,
            fcb_snp_description: combo.fcb_description,
            fcb_snp_price: combo.fcb_price,
            fcb_snp_image: combo.fcb_image,
            fcb_snp_note: combo.fcb_note,
            fcb_snp_sort: combo.fcb_sort,
            fcb_snp_item: JSON.stringify(combo.fcbi_combo)
          })

          listComboSnap.push({
            fcb_id: combo.fcb_id,
            fcb_snp_id: newComboSnap.fcb_snp_id
          })
        })
      )

      const newOrderFoodCombo = await queryRunner.manager.save(OrderFoodComboEntity, {
        od_cb_res_id: od_cb_res_id,
        od_cb_user_id: od_cb_user_id,
        id_user_guest: id_user_guest,
        od_cb_user_name: od_cb_user_name,
        od_cb_user_phone: od_cb_user_phone,
        od_cb_user_email: od_cb_user_email,
        od_cb_user_address: od_cb_user_address,
        od_cb_user_province: od_cb_user_province,
        od_cb_user_district: od_cb_user_district,
        od_cb_user_ward: od_cb_user_ward,
        od_cb_user_note: od_cb_user_note,
        od_cb_price_shipping: od_cb_price_shipping,
        od_cb_type_shipping: od_cb_type_shipping,
        od_cb_status: 'waiting_confirm_customer',
        od_cb_atribute: JSON.stringify([
          {
            type: 'Khách hàng đặt hàng',
            description: 'Khách hàng đã đặt hàng, vui lòng xác nhận đặt hàng trong vòng 10 phút',
            time: currentTime
          }
        ]),
        od_cb_created_at: currentTime
      })

      await Promise.all(
        order_food_combo_items.map(async (item) => {
          await queryRunner.manager.save(OrderFoodComboItemEntity, {
            od_cb_res_id: od_cb_res_id,
            od_cb_id: newOrderFoodCombo.od_cb_id,
            fcb_snp_id: listComboSnap.find((combo) => combo.fcb_id === item.fcb_id)?.fcb_snp_id,
            od_cb_it_quantity: item.od_cb_it_quantity
          })
        })
      )

      const linkConfirm = `${od_cb_link_confirm}?od_cb_id=${newOrderFoodCombo.od_cb_id}&od_cb_res_id=${od_cb_res_id}`
      console.log('linkConfirm', linkConfirm)
      sendMessageToKafka({
        topic: 'CREATE_ORDER_FOOD_COMBO',
        message: JSON.stringify({
          to: od_cb_user_email,
          subject: 'Xác nhận đặt hàng',
          text: `Bạn nhận được email này vì có một đơn hàng mới từ khách hàng ${od_cb_user_name} với số điện thoại ${od_cb_user_phone} và email ${od_cb_user_email}. Vui lòng xác nhận đơn hàng trong vòng 10 phút. Để xác nhận đơn hàng, vui lòng nhấp vào liên kết bên dưới. Nếu bạn không phải là người nhận email này, vui lòng bỏ qua nó.`,
          link: linkConfirm
        })
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: createOrderFoodComboDto.od_cb_user_name,
          noti_content: `Nhà hàng vừa có đơn hàng đặt combo mới từ ${createOrderFoodComboDto.od_cb_user_name}`,
          noti_title: `Đặt combo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await queryRunner.commitTransaction()
      return newOrderFoodCombo
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'createOrderFoodCombo',
        error: error,
        class: 'OrderFoodComboService',
        function: 'createOrderFoodCombo',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    } finally {
      await queryRunner.release()
    }
  }

  async guestConfirmOrderFoodCombo(od_cb_id: string, od_cb_res_id: string): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          od_cb_status: 'waiting_confirm_customer'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      orderFoodCombo.od_cb_status = 'waiting_confirm_restaurant'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng xác nhận đơn hàng',
          description: 'Khách hàng đã xác nhận đơn hàng, chờ nhà hàng xác nhận đơn hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async guestCancelOrderFoodCombo(
    od_cb_id: string,
    od_cb_res_id: string,
    od_cb_reason_cancel: string,
    id_user_guest: string
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          id_user_guest,
          od_cb_status: 'waiting_confirm_customer'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể hủy đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể hủy đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể hủy đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'cancel_customer'
      orderFoodCombo.od_cb_reason_cancel = od_cb_reason_cancel
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng hủy đơn hàng',
          description: `Khách hàng đã hủy đơn hàng, lý do: ${od_cb_reason_cancel}`,
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async restaurantConfirmOrderFoodCombo(od_cb_id: string, account: IAccount): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_status: 'waiting_confirm_restaurant'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'waiting_shipping'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Nhà hàng xác nhận đơn hàng',
          description: 'Nhà hàng đã xác nhận đơn hàng, chờ giao hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async restaurantConfirmShippingOrderFoodCombo(od_cb_id: string, account: IAccount): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_status: 'waiting_shipping'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'shipping'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Nhà hàng xác nhận đang giao hàng',
          description: 'Nhà hàng đã xác nhận đang giao hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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
  async restaurantDeliveredOrderFoodCombo(od_cb_id: string, account: IAccount): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_status: 'shipping'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'delivered_customer'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Nhà hàng xác nhận đã giao hàng đến khách hàng',
          description: 'Nhà hàng đã xác nhận đã giao hàng đến khách hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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
  async restaurantCustomerUnreachableOrderFoodCombo(
    od_cb_id: string,
    account: IAccount
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_status: 'shipping'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_customer') {
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể xác nhận đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'cancel_restaurant') {
        throw new BadRequestError('Đơn hàng đã bị hủy bởi nhà hàng, không thể xác nhận đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'customer_unreachable'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Không liên lạc được với khách hàng',
          description: 'Nhà hàng đã cố gắng liên lạc với khách hàng nhưng không thành công',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async restaurantCancelOrderFoodCombo(
    od_cb_id: string,
    od_cb_reason_cancel: string,
    account: IAccount
  ): Promise<OrderFoodComboEntity> {
    try {
      if (!od_cb_reason_cancel) {
        throw new BadRequestError('Vui lòng nhập lý do hủy đơn hàng')
      }
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_status: In(['waiting_confirm_restaurant', 'waiting_shipping'])
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'shipping') {
        throw new BadRequestError('Đơn hàng đang được giao, không thể hủy đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'delivered_customer') {
        throw new BadRequestError('Đơn hàng đã được giao, không thể hủy đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể hủy đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'cancel_restaurant'
      orderFoodCombo.od_cb_reason_cancel = od_cb_reason_cancel
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Nhà hàng hủy đơn hàng',
          description: `Nhà hàng đã hủy đơn hàng, lý do: ${od_cb_reason_cancel}`,
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async guestReceivedOrderFoodCombo(
    od_cb_id: string,
    od_cb_res_id: string,
    id_user_guest: string
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          id_user_guest,
          od_cb_status: 'delivered_customer'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      // if (orderFoodCombo.od_cb_status === 'delivered_customer') {
      //   throw new BadRequestError('Đơn hàng đã được giao, không thể xác nhận đơn hàng');
      // }

      if (orderFoodCombo.od_cb_status === 'received_customer') {
        throw new BadRequestError('Đơn hàng đã được xác nhận, không thể xác nhận đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'received_customer'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng xác nhận đã nhận đơn hàng',
          description: 'Khách hàng đã xác nhận đã nhận đơn hàng',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async guestComplaintOrderFoodCombo(
    od_cb_id: string,
    od_cb_res_id: string,
    id_user_guest: string,
    complaint: string
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          id_user_guest,
          od_cb_status: 'received_customer'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'complaint') {
        throw new BadRequestError('Đơn hàng đã khiếu nại, không thể khiếu nại đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'complaint_done') {
        throw new BadRequestError('Đơn hàng đã khiếu nại và đã được giải quyết, không thể khiếu nại đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'complaint'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng khiếu nại đơn hàng',
          description: `Khách hàng đã khiếu nại đơn hàng`,
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async guestComplaintDoneOrderFoodCombo(
    od_cb_id: string,
    od_cb_res_id: string,
    id_user_guest: string
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          id_user_guest,
          od_cb_status: 'complaint'
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_status === 'complaint_done') {
        throw new BadRequestError('Đơn hàng đã khiếu nại và đã được giải quyết, không thể khiếu nại đơn hàng')
      }

      orderFoodCombo.od_cb_status = 'complaint_done'
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng xác nhận đã giải quyết khiếu nại',
          description: 'Khách hàng đã xác nhận đã giải quyết khiếu nại',
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async guestFeedbackOrderFoodCombo(
    od_cb_id: string,
    od_cb_res_id: string,
    id_user_guest: string,
    od_cb_feed_star: 1 | 2 | 3 | 4 | 5,
    od_cb_feed_content: string
  ): Promise<OrderFoodComboEntity> {
    try {
      if (!od_cb_feed_star) {
        throw new BadRequestError('Bạn chưa đánh giá đơn hàng, vui lòng thử lại sau')
      }
      if (!od_cb_feed_content) {
        throw new BadRequestError('Bạn chưa nhập nội dung đánh giá đơn hàng, vui lòng thử lại sau')
      }
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id,
          id_user_guest,
          od_cb_status: In(['complaint_done', 'received_customer'])
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (orderFoodCombo.od_cb_feed_star) {
        throw new BadRequestError('Đơn hàng đã được đánh giá, không thể đánh giá lại đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'complaint') {
        throw new BadRequestError('Đơn hàng đang khiếu nại, không thể đánh giá đơn hàng')
      }

      if (orderFoodCombo.od_cb_status === 'waiting_confirm_customer')
        throw new BadRequestError('Đơn hàng đang chờ xác nhận, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'waiting_confirm_restaurant')
        throw new BadRequestError('Đơn hàng đang chờ xác nhận, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'waiting_shipping')
        throw new BadRequestError('Đơn hàng đang chờ giao hàng, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'shipping')
        throw new BadRequestError('Đơn hàng đang giao hàng, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'delivered_customer')
        throw new BadRequestError('Đơn hàng đã giao hàng, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'cancel_customer')
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể đánh giá đơn hàng')
      if (orderFoodCombo.od_cb_status === 'cancel_restaurant')
        throw new BadRequestError('Đơn hàng đã bị hủy, không thể đánh giá đơn hàng')

      orderFoodCombo.od_cb_feed_star = od_cb_feed_star
      orderFoodCombo.od_cb_feed_content = od_cb_feed_content
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Khách hàng đánh giá đơn hàng',
          description: `Khách hàng đã đánh giá đơn hàng với ${od_cb_feed_star} sao và nội dung là ${od_cb_feed_content}`,
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async restaurantFeedbackOrderFoodCombo(
    od_cb_id: string,
    od_cb_feed_reply: string,
    account: IAccount
  ): Promise<OrderFoodComboEntity> {
    try {
      if (!od_cb_feed_reply) {
        throw new BadRequestError('Bạn chưa nhập nội dung phản hồi đơn hàng, vui lòng thử lại sau')
      }
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id,
          od_cb_feed_star: In([1, 2, 3, 4, 5]),
          od_cb_feed_reply: null
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (!orderFoodCombo.od_cb_feed_star) {
        throw new BadRequestError('Đơn hàng chưa được đánh giá, không thể phản hồi đơn hàng')
      }

      if (orderFoodCombo.od_cb_feed_reply) {
        throw new BadRequestError('Đơn hàng đã được phản hồi, không thể phản hồi lại đơn hàng')
      }

      orderFoodCombo.od_cb_feed_reply = od_cb_feed_reply
      orderFoodCombo.od_cb_atribute = JSON.stringify([
        ...JSON.parse(orderFoodCombo.od_cb_atribute),
        {
          type: 'Nhà hàng phản hồi đánh giá của khách hàng',
          description: `Nhà hàng đã phản hồi đánh giá của khách hàng với nội dung là ${od_cb_feed_reply}`,
          time: new Date()
        }
      ])

      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async restaurantUpdateViewFeedbackOrderFoodCombo(
    od_cb_id: string,
    od_cb_feed_view: 'active' | 'disable',
    account: IAccount
  ): Promise<OrderFoodComboEntity> {
    try {
      const orderFoodCombo = await this.orderFoodComboRepository.findOne({
        where: {
          od_cb_id,
          od_cb_res_id: account.account_restaurant_id
        }
      })

      if (!orderFoodCombo) {
        throw new BadRequestError('Đơn hàng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      if (!orderFoodCombo.od_cb_feed_star) {
        throw new BadRequestError('Đơn hàng chưa được đánh giá, không thể phản hồi đơn hàng')
      }

      if (!orderFoodCombo.od_cb_feed_reply) {
        throw new BadRequestError('Đơn hàng chưa được phản hồi, không thể cập nhật trạng thái')
      }

      orderFoodCombo.od_cb_feed_view = od_cb_feed_view
      return await this.orderFoodComboRepository.save(orderFoodCombo)
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

  async getListOrderFoodComboRestaurantPagination(
    {
      fromDate,
      keyword,
      od_cb_status,
      pageIndex,
      pageSize = 10,
      toDate
    }: {
      pageSize?: number
      pageIndex: number
      keyword: string
      od_cb_status:
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
  ): Promise<ResultPagination<OrderFoodComboEntity>> {
    try {
      const whereConditions: any = {
        od_cb_res_id: account.account_restaurant_id
      }

      if (od_cb_status !== 'all') {
        whereConditions.od_cb_status = od_cb_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          whereConditions.od_cb_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          whereConditions.od_cb_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          whereConditions.od_cb_created_at = LessThanOrEqual(to)
        }
      }

      if (keyword) {
        whereConditions.od_user_name = Like(`%${keyword}%`)
        whereConditions.od_user_phone = Like(`%${keyword}%`)
        whereConditions.od_user_email = Like(`%${keyword}%`)
        whereConditions.od_user_address = Like(`%${keyword}%`)
        whereConditions.od_user_note = Like(`%${keyword}%`)
      }

      const orderFoodCombo = await this.orderFoodComboRepository.find({
        where: whereConditions,
        order: {
          od_cb_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['orderItems', 'orderItems.foodComboSnap']
      })

      const total = await this.orderFoodComboRepository.count({
        where: whereConditions
      })

      const totalPage = Math.ceil(total / pageSize)
      const result: ResultPagination<OrderFoodComboEntity> = {
        meta: {
          current: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: orderFoodCombo
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListOrderFoodComboRestaurantPagination',
        error: error,
        class: 'OrderFoodService',
        function: 'getListOrderFoodComboRestaurantPagination',
        message: error.message,
        time: new Date(),
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListOrderFoodComboGuestPagination({
    id_user_guest,
    toDate,
    fromDate,
    keyword,
    od_cb_status,
    pageIndex,
    pageSize = 10
  }: {
    id_user_guest: string
    pageSize?: number
    pageIndex: number
    keyword: string
    od_cb_status:
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
    result: OrderFoodComboEntity[]
  }> {
    try {
      const whereConditions: any = {
        id_user_guest
      }

      if (od_cb_status !== 'all') {
        whereConditions.od_cb_status = od_cb_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          whereConditions.od_cb_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          whereConditions.od_cb_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          whereConditions.od_cb_created_at = LessThanOrEqual(to)
        }
      }

      if (keyword) {
        whereConditions.od_user_name = Like(`%${keyword}%`)
        whereConditions.od_user_phone = Like(`%${keyword}%`)
        whereConditions.od_user_email = Like(`%${keyword}%`)
        whereConditions.od_user_address = Like(`%${keyword}%`)
        whereConditions.od_user_note = Like(`%${keyword}%`)
      }

      const orderFoodCombo = await this.orderFoodComboRepository.find({
        where: whereConditions,
        order: {
          od_cb_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['orderItems', 'orderItems.foodComboSnap']
      })

      const total = await this.orderFoodComboRepository.count({
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
        result: OrderFoodComboEntity[]
      } = {
        meta: {
          pageIndex: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: orderFoodCombo
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListOrderFoodComboGuestPagination',
        error: error,
        class: 'OrderFoodService',
        function: 'getListOrderFoodComboGuestPagination',
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

  // API 1: Total Combo Revenue
  async getTotalComboRevenue(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodComboRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodComboSnap', 'comboSnap')
      .where('order.od_cb_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_cb_type_shipping = :status', { status: 'GHTK' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_cb_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .getMany()

    const totalRevenue = orders.reduce((sum, order) => {
      const orderTotal = order.orderItems.reduce((itemSum, item) => {
        return itemSum + item.od_cb_it_quantity * item.foodComboSnap.fcb_snp_price
      }, 0)
      return sum + orderTotal
    }, 0)

    return { totalComboRevenue: totalRevenue }
  }

  // API 2: Combo Revenue Trends (Daily)
  async getComboRevenueTrends(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodComboRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodComboSnap', 'comboSnap')
      .where('order.od_cb_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_cb_type_shipping = :status', { status: 'GHTK' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_cb_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .getMany()

    const trendsMap = new Map<string, number>()
    orders.forEach((order) => {
      const date = order.od_cb_created_at.toISOString().split('T')[0]
      const orderTotal = order.orderItems.reduce((sum, item) => {
        return sum + item.od_cb_it_quantity * item.foodComboSnap.fcb_snp_price
      }, 0)
      trendsMap.set(date, (trendsMap.get(date) || 0) + orderTotal)
    })

    const trends = Array.from(trendsMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return trends // Format: [{ date: '2025-04-01', revenue: 5000000 }, ...]
  }

  // API 3: Top Combos
  async getTopCombos(dto: GetStatsDto, account: IAccount) {
    const items = await this.orderFoodComboItemRepository
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.orderCombo', 'order')
      .innerJoinAndSelect('item.foodComboSnap', 'comboSnap')
      .where('order.od_cb_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere('order.od_cb_type_shipping = :status', { status: 'GHTK' })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_cb_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .groupBy('comboSnap.fcb_snp_id, comboSnap.fcb_snp_name')
      .select([
        'comboSnap.fcb_snp_name AS name',
        'SUM(item.od_cb_it_quantity) AS orders',
        'SUM(item.od_cb_it_quantity * comboSnap.fcb_snp_price) AS revenue'
      ])
      .orderBy('orders', 'DESC')
      .limit(5)
      .getRawMany()

    return items.map((item) => ({
      name: item.NAME,
      orders: parseInt(item.ORDERS),
      revenue: parseFloat(item.REVENUE)
    })) // Format: [{ name: 'Combo Phở Gà', orders: 50, revenue: 2500000 }, ...]
  }

  // API 4: Recent Combo Orders
  async getRecentComboOrders(dto: GetStatsDto, account: IAccount) {
    const orders = await this.orderFoodComboRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'items')
      .innerJoinAndSelect('items.foodComboSnap', 'comboSnap')
      .where('order.od_cb_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
      .andWhere(dto.startDate || dto.endDate ? 'order.od_cb_created_at BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate ? new Date(dto.startDate) : new Date(0),
        end: dto.endDate ? new Date(dto.endDate) : new Date()
      })
      .orderBy('order.od_cb_created_at', 'DESC')
      .take(5)
      .getMany()

    return orders.map((order) => ({
      id: order.od_cb_id,
      customer: order.od_cb_user_name || 'Khách vãng lai',
      total: order.orderItems.reduce((sum, item) => {
        return sum + item.od_cb_it_quantity * item.foodComboSnap.fcb_snp_price
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
      }[order.od_cb_status]
    })) // Format: [{ id: 'uuid', customer: 'Nguyễn Văn A', total: 300000, status: 'Hoàn thành' }, ...]
  }
}
