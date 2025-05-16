import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { OrderFoodComboItemEntity } from './order-food-combo-item.entity'
import { FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'

@Entity('food_combo_snap')
export class FoodComboSnapEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fcb_snp_id?: string = uuidv4()

  @Column('varchar', { length: 255 })
  fcb_id: string

  @Column('varchar', { length: 24 })
  fcb_snp_res_id?: string

  @Column('varchar', { length: 255 })
  fcb_snp_name?: string

  @Column('varchar', { length: 255 })
  fcb_snp_slug?: string

  @Column('clob')
  fcb_snp_description?: string

  @Column('number')
  fcb_snp_price?: number

  @Column('clob')
  fcb_snp_image?: string

  @Column('varchar', { length: 255 })
  fcb_snp_note?: string

  @Column('number')
  fcb_snp_sort?: number

  @Column('clob')
  fcb_snp_item?: string

  @OneToMany(() => OrderFoodComboItemEntity, (orderItem) => orderItem.foodComboSnap)
  orderItems?: OrderFoodComboItemEntity[]
}

@EventSubscriber()
export class FoodComboSnapSubscriber implements EntitySubscriberInterface<FoodComboSnapEntity> {
  listenTo() {
    return FoodComboSnapEntity
  }

  async afterInsert(event: InsertEvent<FoodComboSnapEntity>): Promise<void> {
    await addDocToElasticsearch(FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX, event.entity.fcb_snp_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<FoodComboSnapEntity>): Promise<void> {
    await updateDocByElasticsearch(FOOD_COMBO_SNAP_ELASTICSEARCH_INDEX, event.entity.fcb_snp_id, event.entity)
  }
}