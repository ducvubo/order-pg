import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { OrderFoodItemEntity } from './order-food-item.entity'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { FOOD_SNAP_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'

@Entity('food_snap')
export class FoodSnapEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fsnp_id?: string = uuidv4()

  @Column('varchar', { length: 255 })
  food_id: string

  @Column('varchar', { length: 24 })
  fsnp_res_id?: string

  @Column('varchar', { length: 255 })
  fsnp_name?: string

  @Column('varchar', { length: 255 })
  fsnp_slug?: string

  @Column('clob')
  fsnp_description?: string

  @Column('number')
  fsnp_price?: number

  @Column('clob')
  fsnp_image?: string

  @Column('varchar', { length: 255 })
  fsnp_note?: string

  @Column('clob')
  fsnp_options?: string

  @OneToMany(() => OrderFoodItemEntity, (orderItem) => orderItem.foodSnap)
  orderItems?: OrderFoodItemEntity[];
}

@EventSubscriber()
export class FoodSnapSubscriber implements EntitySubscriberInterface<FoodSnapEntity> {
  listenTo() {
    return FoodSnapEntity
  }

  async afterInsert(event: InsertEvent<FoodSnapEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_SNAP_ELASTICSEARCH_INDEX, event.entity.fsnp_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<FoodSnapEntity>): Promise<void> {
    await updateDocByElasticsearch(FOOD_SNAP_ELASTICSEARCH_INDEX, event.entity.fsnp_id, event.entity)
  }
}