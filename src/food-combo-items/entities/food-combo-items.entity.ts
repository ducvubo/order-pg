import { FoodComboResEntity } from 'src/combo-food-res/entities/combo-food-res.entity'
import { FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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
  ManyToOne,
  JoinColumn,
  RemoveEvent
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('food-combo-items')
export class FoodComboItemsEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fcbi_id?: string = uuidv4()

  @Column('char', { length: 24 })
  fcbi_res_id?: string

  @Column('char', { length: 36 })
  fcbi_food_id?: string

  @Column('char', { length: 36 })
  fcbi_combo_id?: string

  @Column('int')
  fcbi_quantity?: number

  @ManyToOne(() => FoodRestaurantEntity, (food) => food.fcbi_food, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'fcbi_food_id' })
  fcbi_food?: FoodRestaurantEntity

  @ManyToOne(() => FoodComboResEntity, (combo) => combo.fcbi_combo, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'fcbi_combo_id' })
  fcbi_combo?: FoodComboResEntity
}

@EventSubscriber()
export class FoodComboItemsSubscriber implements EntitySubscriberInterface<FoodComboItemsEntity> {
  listenTo() {
    return FoodComboItemsEntity
  }

  async afterInsert(event: InsertEvent<FoodComboItemsEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, event.entity.fcbi_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<FoodComboItemsEntity>): Promise<void> {
    await updateDocByElasticsearch(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, event.entity.fcbi_id, event.entity)
  }

  async afterRemove(event: RemoveEvent<FoodComboItemsEntity>): Promise<void> {
    await deleteDocByElasticsearch(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX, event.entityId)
  }
}
