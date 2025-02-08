import { FOOD_OPTIONS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { FoodRestaurantEntity } from 'src/food-restaurant/entities/food-restaurant.entity'
import { addDocToElasticsearch, deleteDocByElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  JoinColumn,
  ManyToOne
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('food-options')
export class FoodOptionsEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fopt_id?: string = uuidv4()

  @Column('varchar')
  fopt_res_id?: string

  @Column('varchar')
  fopt_food_id?: string

  @Column('varchar', { length: 255 })
  fopt_name?: string

  @Column('varchar', { length: 255 })
  fopt_attribute?: string

  @Column('int', { default: 0 })
  fopt_price?: number

  @Column('clob')
  fopt_image?: string

  @Column('varchar', { length: 255, default: 'enable' })
  fopt_status?: string

  //state: soldOut: hết hàng, inStock: Còn hàng, almostOut: Sắp hết hàng
  @Column('varchar', { length: 255, default: 'inStock' })
  fopt_state?: string

  @Column('varchar', { length: 255 })
  fopt_note?: string

  @ManyToOne(() => FoodRestaurantEntity, (food) => food.fopt_food, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'fopt_food_id' })
  fopt_food?: FoodRestaurantEntity
}

@EventSubscriber()
export class FoodOptionsSubscriber implements EntitySubscriberInterface<FoodOptionsEntity> {
  listenTo() {
    return FoodOptionsEntity
  }

  async afterInsert(event: InsertEvent<FoodOptionsEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_OPTIONS_ELASTICSEARCH_INDEX, event.entity.fopt_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<FoodOptionsEntity>): Promise<void> {
    await updateDocByElasticsearch(FOOD_OPTIONS_ELASTICSEARCH_INDEX, event.entity.fopt_id, event.entity)
  }

  async afterRemove(event: RemoveEvent<FoodOptionsEntity>): Promise<void> {
    await deleteDocByElasticsearch(FOOD_OPTIONS_ELASTICSEARCH_INDEX, event.entityId)
  }
}
