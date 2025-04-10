import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FoodComboResEntity } from 'src/combo-food-res/entities/combo-food-res.entity';
import { FoodComboItemsEntity } from 'src/food-combo-items/entities/food-combo-items.entity';
import { FoodRestaurantEntity } from 'src/food-restaurant/entities/food-restaurant.entity';
import { DataSource, Repository } from 'typeorm';
import { OrderFoodComboEntity } from './entities/order-food-combo.entity';
import { OrderFoodComboItemEntity } from './entities/order-food-combo-item.entity';
import { FoodComboSnapEntity } from './entities/food-combo-snap.entity';
import { CreateOrderFoodComboDto } from './dto/create-order-food-combo.dto';
import { saveLogSystem } from 'src/log/sendLog.els';
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse';
import { sendMessageToKafka } from 'src/utils/kafka';
import { text } from 'stream/consumers';

@Injectable()
export class OrderFoodComboService {
  constructor(
    private readonly dataSource: DataSource,
    // @InjectRepository(FoodRestaurantEntity)
    // private readonly foodRestaurantRepository: Repository<FoodRestaurantEntity>,
    // @InjectRepository(FoodComboResEntity)
    // private readonly foodComboResRepository: Repository<FoodComboResEntity>,
    // @InjectRepository(FoodComboItemsEntity)
    // private readonly foodComboItemsRepository: Repository<FoodComboItemsEntity>,
    // @InjectRepository(OrderFoodComboEntity)
    // private readonly orderFoodComboRepository: Repository<OrderFoodComboEntity>,
    // @InjectRepository(OrderFoodComboItemEntity)
    // private readonly orderFoodComboItemRepository: Repository<OrderFoodComboItemEntity>,
    // @InjectRepository(FoodComboSnapEntity)
    // private readonly foodComboSnapRepository: Repository<FoodComboSnapEntity>,
  ) { }

  async createOrderFoodCombo(createOrderFoodComboDto: CreateOrderFoodComboDto, id_user_guest: string): Promise<OrderFoodComboEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 7);

      const { od_cb_res_id, od_cb_user_name, od_cb_user_phone, od_cb_user_email, od_cb_user_address, od_cb_user_province, od_cb_user_district, od_cb_user_ward, od_cb_user_note, od_cb_link_confirm, od_cb_price_shipping, od_cb_type_shipping, od_cb_user_id, order_food_combo_items } = createOrderFoodComboDto;

      //snap combo
      const listComboSnap: { fcb_id: string, fcb_snp_id: string }[] = []
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
            throw new BadRequestError("Combo món ăn không tồn tại")
          }

          const [openHours, openMinutes] = combo.fcb_open_time.split(':').map(Number);
          const [closeHours, closeMinutes] = combo.fcb_close_time.split(':').map(Number);

          const openTime = new Date(currentTime);
          openTime.setHours(openHours, openMinutes, 0, 0);

          const closeTime = new Date(currentTime);
          closeTime.setHours(closeHours, closeMinutes, 0, 0);

          if (currentTime < openTime || currentTime > closeTime) {
            throw new BadRequestError('Combo món ăn này không trong thời gian phục vụ hiện tại của nhà hàng, vui lòng thử lại sau');
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
            time: currentTime,
          },
        ]),
        od_cb_created_at: currentTime,
      })

      await Promise.all(
        order_food_combo_items.map(async (item) => {
          await queryRunner.manager.save(OrderFoodComboItemEntity, {
            od_cb_res_id: od_cb_res_id,
            od_cb_id: newOrderFoodCombo.od_cb_id,
            fcb_snp_id: listComboSnap.find(combo => combo.fcb_id === item.fcb_id)?.fcb_snp_id,
            od_cb_it_quantity: item.od_cb_it_quantity,
          })
        })
      )

      const linkConfirm = `${od_cb_link_confirm}?od_id=${newOrderFoodCombo.od_cb_id}&od_res_id=${od_cb_res_id}`
      console.log('linkConfirm', linkConfirm)
      sendMessageToKafka({
        topic: 'CREATE_ORDER_FOOD_COMBO',
        message: JSON.stringify({
          to: od_cb_user_email,
          subject: 'Xác nhận đặt hàng',
          text: `Bạn nhận được email này vì có một đơn hàng mới từ khách hàng ${od_cb_user_name} với số điện thoại ${od_cb_user_phone} và email ${od_cb_user_email}. Vui lòng xác nhận đơn hàng trong vòng 10 phút. Để xác nhận đơn hàng, vui lòng nhấp vào liên kết sau: <a href="${linkConfirm}">Xác nhận đơn hàng</a>. Nếu bạn không phải là người nhận email này, vui lòng bỏ qua nó.`,
        })
      })

      await queryRunner.commitTransaction();
      return newOrderFoodCombo
    } catch (error) {
      await queryRunner.rollbackTransaction();
      saveLogSystem({
        action: 'createOrderFoodCombo',
        error: error,
        class: 'OrderFoodComboService',
        function: 'createOrderFoodCombo',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    } finally {
      await queryRunner.release();
    }
  }

}
