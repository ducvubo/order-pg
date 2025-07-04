import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderFoodComboEntity } from 'src/order-food-combo/entities/order-food-combo.entity';
import { OrderFoodEntity } from 'src/order-food/entities/order-food.entity';
import { DataSource, LessThan } from 'typeorm';

@Injectable()
export class CronService {
  constructor(private readonly dataSource: DataSource) { }

  @Cron('* * * * *')
  async checkOrderTimeouts() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 7);

      const tenMinutesAgo = new Date(currentTime);
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      //OrderFood
      const overdueOrders = await queryRunner.manager.find(OrderFoodEntity, {
        where: {
          od_status: 'waiting_confirm_customer',
          od_created_at: LessThan(tenMinutesAgo),
        },
      });

      if (overdueOrders.length > 0) {
        await Promise.all(
          overdueOrders.map(async (order) => {
            order.od_status = 'over_time_customer';
            order.od_atribute = JSON.stringify([
              ...(JSON.parse(order.od_atribute || '[]')),
              {
                type: 'Quá hạn xác nhận',
                description: 'Đơn hàng đã quá 10 phút mà không được xác nhận bởi khách hàng',
                time: currentTime,
              },
            ]);
            await queryRunner.manager.save(OrderFoodEntity, order);
          })
        );
        console.log(`Updated ${overdueOrders.length} orders to 'over_time_customer'`);
      } else {
      }

      //OrderFoodCombo
      const currentTimeCombo = new Date();
      currentTimeCombo.setHours(currentTimeCombo.getHours());

      const tenMinutesAgoCombo = new Date(currentTimeCombo);
      tenMinutesAgoCombo.setMinutes(tenMinutesAgoCombo.getMinutes() - 10);

      const overdueOrdersCombo = await queryRunner.manager.find(OrderFoodComboEntity, {
        where: {
          od_cb_status: 'waiting_confirm_customer',
          od_cb_created_at: LessThan(tenMinutesAgoCombo),
        },
      });

      if (overdueOrdersCombo.length > 0) {
        await Promise.all(
          overdueOrdersCombo.map(async (order) => {
            order.od_cb_status = 'over_time_customer';
            order.od_cb_atribute = JSON.stringify([
              ...(JSON.parse(order.od_cb_atribute || '[]')),
              {
                type: 'Quá hạn xác nhận',
                description: 'Đơn hàng đã quá 10 phút mà không được xác nhận bởi khách hàng',
                time: currentTimeCombo,
              },
            ]);
            await queryRunner.manager.save(OrderFoodComboEntity, order);
          })
        );
        console.log(`Updated ${overdueOrdersCombo.length} combo orders to 'over_time_customer'`);
      } else {
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in checkOrderTimeouts:', error.message);
    } finally {
      await queryRunner.release();
    }
  }
}