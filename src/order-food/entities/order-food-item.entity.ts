import { ORDER_FOOD_ELASTICSEARCH_INDEX, ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { OrderFoodEntity } from './order-food.entity'
import { FoodSnapEntity } from './food-snap.entity'

@Entity('order_food_item')
export class OrderFoodItemEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  od_it_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  od_res_id?: string

  @Column('uuid', { default: 0 })
  od_id?: string

  @Column('varchar', { length: 255 })
  fsnp_id: string

  @Column('number')
  od_it_quantity?: number

  @ManyToOne(() => OrderFoodEntity, (order) => order.orderItems)
  @JoinColumn({ name: 'od_id' }) // Khóa ngoại là od_id
  order?: OrderFoodEntity;

  // Quan hệ nhiều-1 với FoodSnapEntity
  @ManyToOne(() => FoodSnapEntity)
  @JoinColumn({ name: 'fsnp_id' }) // Khóa ngoại là fsnp_id
  foodSnap?: FoodSnapEntity;
}

@EventSubscriber()
export class OrderFoodItemSubscriber implements EntitySubscriberInterface<OrderFoodItemEntity> {
  listenTo() {
    return OrderFoodItemEntity
  }

  async afterInsert(event: InsertEvent<OrderFoodItemEntity>): Promise<void> {
    await addDocToElasticsearch(ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX, event.entity.od_it_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<OrderFoodItemEntity>): Promise<void> {
    await updateDocByElasticsearch(ORDER_FOOD_ITEM_ELASTICSEARCH_INDEX, event.entity.od_it_id, event.entity)
  }
}