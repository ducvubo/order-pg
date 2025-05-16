import { ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, ORDER_FOOD_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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
import { FoodComboSnapEntity } from './food-combo-snap.entity'
import { OrderFoodComboEntity } from './order-food-combo.entity'

@Entity('order_food_combo_item')
export class OrderFoodComboItemEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  od_cb_it_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  od_cb_res_id?: string

  @Column('uuid', { default: 0 })
  od_cb_id?: string

  @Column('varchar', { length: 255 })
  fcb_snp_id: string

  @Column('number')
  od_cb_it_quantity?: number

  @ManyToOne(() => FoodComboSnapEntity, (foodComboSnap) => foodComboSnap.orderItems)
  @JoinColumn({ name: 'fcb_snp_id' })
  foodComboSnap?: FoodComboSnapEntity

  // Định nghĩa mối quan hệ Many-to-One với OrderFoodComboEntity
  @ManyToOne(() => OrderFoodComboEntity, (orderCombo) => orderCombo.orderItems)
  @JoinColumn({ name: 'od_cb_id' })
  orderCombo?: OrderFoodComboEntity
}

@EventSubscriber()
export class OrderFoodComboItemSubscriber implements EntitySubscriberInterface<OrderFoodComboItemEntity> {
  listenTo() {
    return OrderFoodComboItemEntity
  }

  async afterInsert(event: InsertEvent<OrderFoodComboItemEntity>): Promise<void> {
    await addDocToElasticsearch(ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, event.entity.od_cb_it_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<OrderFoodComboItemEntity>): Promise<void> {
    await updateDocByElasticsearch(ORDER_FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, event.entity.od_cb_it_id, event.entity)
  }
}