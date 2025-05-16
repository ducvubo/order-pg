import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  EventSubscriber,
  InsertEvent,
  EntitySubscriberInterface,
  UpdateEvent,

} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { OrderFoodItemEntity } from './order-food-item.entity'
import { ORDER_FOOD_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'

@Entity('order_food')
export class OrderFoodEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  od_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  od_res_id?: string

  @Column('number', { default: 0, nullable: true })
  od_user_id?: number

  @Column('varchar', { length: 255 })
  id_user_guest?: string

  @Column('varchar', { length: 255 })
  od_user_name?: string

  @Column('varchar', { length: 255 })
  od_user_phone?: string

  @Column('varchar', { length: 255 })
  od_user_email?: string

  @Column('varchar', { length: 255 })
  od_user_address?: string

  @Column('varchar', { length: 255 })
  od_user_province?: string

  @Column('varchar', { length: 255 })
  od_user_district?: string

  @Column('varchar', { length: 255 })
  od_user_ward?: string

  @Column('varchar', { length: 255, nullable: true })
  od_user_note?: string

  /*
  //waiting_confirm_customer,over_time_customer, waiting waiting_confirm_restaurant, waiting_shipping, shipping, delivered_customer, received_customer -> ok
  //cancel_customer, cancel_restaurant
  //complaint, complaint_done
  waiting_confirm_customer: 'Chờ xác nhận từ khách hàng',
  over_time_customer: 'Quá hạn xác nhận từ khách hàng',
  waiting_confirm_restaurant: 'Chờ nhà hàng xác nhận',
  waiting_shipping: 'Chờ giao hàng',
  shipping: 'Đang giao hàng',
  delivered_customer: 'Đã giao hàng đến khách hàng',
  customer_unreachable: 'Khách hàng không liên lạc được',
  received_customer: 'Khách hàng đã nhận hàng',
  cancel_customer: 'Khách hàng đã hủy đơn hàng',
  cancel_restaurant: 'Nhà hàng đã hủy đơn hàng',
  complaint: 'Khiếu nại',
  complaint_done: 'Khiếu nại đã giải quyết',
  */
  @Column('varchar', { length: 255 })
  od_status?: "waiting_confirm_customer" | "over_time_customer" | "waiting_confirm_restaurant" | "waiting_shipping" | "shipping" | "delivered_customer" | "customer_unreachable" | "received_customer" | "cancel_customer" | "cancel_restaurant" | "complaint" | "complaint_done"

  @Column('varchar', { length: 255 })
  od_type_shipping?: 'GHN' | 'GHTK'

  @Column('number')
  od_price_shipping?: number

  @Column('clob')
  od_atribute?: string

  @Column('number', { default: 0 })
  od_feed_star?: 0 | 1 | 2 | 3 | 4 | 5

  @Column('varchar', { length: 255, nullable: true })
  od_feed_content?: string

  @Column('varchar', { length: 255, nullable: true })
  od_feed_reply?: string

  @Column('varchar', { length: 255, nullable: true })
  od_reason_cancel?: string

  @Column('varchar', { length: 255, default: 'disable' })
  od_feed_view?: 'active' | 'disable'

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  od_created_at?: Date

  @OneToMany(() => OrderFoodItemEntity, (orderItem) => orderItem.order, { cascade: true })
  orderItems?: OrderFoodItemEntity[];
}

@EventSubscriber()
export class OrderFoodSubscriber implements EntitySubscriberInterface<OrderFoodEntity> {
  listenTo() {
    return OrderFoodEntity
  }

  async afterInsert(event: InsertEvent<OrderFoodEntity>): Promise<void> {
    await addDocToElasticsearch(ORDER_FOOD_ELASTICSEARCH_INDEX, event.entity.od_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<OrderFoodEntity>): Promise<void> {
    await updateDocByElasticsearch(ORDER_FOOD_ELASTICSEARCH_INDEX, event.entity.od_id, event.entity)
  }
}