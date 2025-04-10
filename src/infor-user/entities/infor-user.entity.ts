import { INFOR_USER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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

@Entity('infor_user')
export class InforUserEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  ifuser_id?: string = uuidv4()

  @Column('varchar', { length: 255 })
  ifuser_guest_id?: string

  @Column('varchar', { length: 255 })
  ifuser_name?: string

  @Column('varchar', { length: 255 })
  ifuser_phone?: string

  @Column('varchar', { length: 255 })
  ifuser_email?: string

  @Column('varchar', { length: 255 })
  ifuser_address?: string

  @Column('varchar', { length: 255 })
  ifuser_province_id?: string

  @Column('varchar', { length: 255 })
  ifuser_district_id?: string

  @Column('varchar', { length: 255 })
  ifuser_ward_id?: string

  @Column('varchar', { length: 255 })
  ifuser_province_name?: string

  @Column('varchar', { length: 255 })
  ifuser_district_name?: string

  @Column('varchar', { length: 255 })
  ifuser_ward_name?: string

  @Column('varchar', { length: 255 })
  ifuser_longitude?: string

  @Column('varchar', { length: 255 })
  ifuser_latitude?: string
}

@EventSubscriber()
export class InforUserSubscriber implements EntitySubscriberInterface<InforUserEntity> {
  listenTo() {
    return InforUserEntity
  }

  async afterInsert(event: InsertEvent<InforUserEntity>): Promise<void> {
    await addDocToElasticsearch(INFOR_USER_ELASTICSEARCH_INDEX, event.entity.ifuser_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<InforUserEntity>): Promise<void> {
    await updateDocByElasticsearch(INFOR_USER_ELASTICSEARCH_INDEX, event.entity.ifuser_id, event.entity)
  }
}
