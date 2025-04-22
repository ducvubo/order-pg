import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { FoodComboItemsEntity } from 'src/food-combo-items/entities/food-combo-items.entity'
import { FoodOptionsEntity } from 'src/food-options/entities/food-options.entity'
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
  OneToMany
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('food_restaurant')
export class FoodRestaurantEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  food_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  food_res_id?: string

  @Column('varchar', { length: 255 })
  food_name?: string

  @Column('varchar', { length: 255 })
  food_slug?: string

  @Column('clob')
  food_description?: string

  @Column('number')
  food_price?: number

  @Column('clob')
  food_image?: string

  @Column('varchar', { length: 255, default: 'enable' })
  food_status?: string

  @Column('varchar', { length: 255, default: 'inStock' }) //soldOut: hết hàng, inStock: Còn hàng, almostOut: Sắp hết hàng
  food_state?: string

  @Column('varchar')
  food_open_time?: string

  @Column('varchar')
  food_close_time?: string

  @Column('varchar', { length: 255 })
  food_note?: string

  @Column('number')
  food_sort?: number

  @OneToMany(() => FoodComboItemsEntity, (item) => item.fcbi_food, { cascade: true })
  fcbi_food?: FoodComboItemsEntity[]

  @OneToMany(() => FoodOptionsEntity, (option) => option.fopt_food, { cascade: true })
  fopt_food?: FoodOptionsEntity[]
}

@EventSubscriber()
export class FoodRestaurantSubscriber implements EntitySubscriberInterface<FoodRestaurantEntity> {
  listenTo() {
    return FoodRestaurantEntity
  }

  async afterInsert(event: InsertEvent<FoodRestaurantEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.food_id, event.entity)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async afterUpdate(event: UpdateEvent<FoodRestaurantEntity>): Promise<void> {
    // const foodRestaurantRepo = event.manager.getRepository(FoodRestaurantEntity)
    // const food = await foodRestaurantRepo.findOne({
    //   where: { food_id: event.entity.food_id }
    // })
    await updateDocByElasticsearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.food_id, event.entity)
  }
}
