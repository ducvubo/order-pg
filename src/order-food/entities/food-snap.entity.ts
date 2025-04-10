import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { OrderFoodItemEntity } from './order-food-item.entity'

@Entity('food_snap')
export class FoodSnapEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  fsnp_id?: string = uuidv4()

  @Column('varchar', { length: 255 })
  food_id: string

  @Column('varchar', { length: 255 })
  food_cat_id: string

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