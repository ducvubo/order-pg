import { FOOD_COMBO_RES_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { FoodComboItemsEntity } from 'src/food-combo-items/entities/food-combo-items.entity'
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

@Entity('food-combo-res')
export class FoodComboResEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fcb_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  fcb_res_id?: string

  @Column('varchar', { length: 255 })
  fcb_name?: string

  @Column('varchar', { length: 255 })
  fcb_slug?: string

  @Column('text')
  fcb_description?: string

  @Column('bigint')
  fcb_price?: number

  @Column('text')
  fcb_image?: string

  @Column('varchar', { length: 255, default: 'enable' })
  fcb_status?: string

  @Column('varchar', { length: 255, default: 'inStock' }) //soldOut: hết hàng, inStock: Còn hàng, almostOut: Sắp hết hàng
  fcb_state?: string

  @Column('varchar')
  fcb_open_time?: string

  @Column('varchar')
  fcb_close_time?: string

  @Column('varchar', { length: 255 })
  fcb_note?: string

  @Column('bigint')
  fcb_sort?: number

  @OneToMany(() => FoodComboItemsEntity, (item) => item.fcbi_combo, { cascade: true })
  fcbi_combo?: FoodComboItemsEntity[]
}

@EventSubscriber()
export class FoodComboResSubscriber implements EntitySubscriberInterface<FoodComboResEntity> {
  listenTo() {
    return FoodComboResEntity
  }

  async afterInsert(event: InsertEvent<FoodComboResEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_COMBO_RES_ELASTICSEARCH_INDEX, event.entity.fcb_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<FoodComboResEntity>): Promise<void> {
    await updateDocByElasticsearch(FOOD_COMBO_RES_ELASTICSEARCH_INDEX, event.entity.fcb_id, event.entity)
  }
}
