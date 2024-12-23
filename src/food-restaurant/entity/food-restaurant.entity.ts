import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToOpenSearch, updateDocByOpenSearch } from 'src/utils/open-search'
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('food_restaurant')
export class FoodRestaurantEntity {
  @PrimaryGeneratedColumn('uuid')
  food_id?: string = uuidv4()

  @Column('char', { length: 36 })
  food_res_id?: string

  @Column('char', { length: 36 })
  food_cat_id?: string

  @Column('varchar', { length: 255 })
  food_name?: string

  @Column('varchar', { length: 255 })
  food_slug?: string

  @Column('longtext')
  food_description?: string

  @Column('bigint')
  food_price?: number

  @Column('longtext')
  food_image?: string

  @Column('varchar', { length: 255, default: 'enable' })
  food_status?: string

  @Column('varchar', { length: 255, default: 'inStock' }) //soldOut: hết hàng, inStock: Còn hàng, almostOut: Sắp hết hàng
  food_state?: string

  @Column('time')
  food_open_time?: string

  @Column('time')
  food_close_time?: string

  @Column('varchar', { length: 255 })
  food_note?: string

  @Column('bigint')
  food_sort?: number

  @CreateDateColumn({ type: 'datetime' })
  createdAt?: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt?: Date

  @DeleteDateColumn({ type: 'datetime' })
  deletedAt?: Date

  @Column({ type: 'int', default: 0 }) // 0: chưa xóa, 1: đã xóa
  isDeleted?: 0 | 1

  @Column('char', { length: 36, nullable: true })
  createdBy?: string

  @Column('char', { length: 36, nullable: true })
  updatedBy?: string

  @Column('char', { length: 36, nullable: true })
  deletedBy?: string
}

@EventSubscriber()
export class FoodRestaurantSubscriber implements EntitySubscriberInterface<FoodRestaurantEntity> {
  listenTo() {
    return FoodRestaurantEntity
  }

  async afterInsert(event: InsertEvent<FoodRestaurantEntity>): Promise<void> {
    await addDocToOpenSearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.food_id, event.entity)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async afterUpdate(event: UpdateEvent<FoodRestaurantEntity>): Promise<void> {
    // const foodRestaurantRepo = event.manager.getRepository(FoodRestaurantEntity)
    // const food = await foodRestaurantRepo.findOne({
    //   where: { food_id: event.entity.food_id }
    // })
    await updateDocByOpenSearch(FOOD_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.food_id, event.entity)
  }
}
