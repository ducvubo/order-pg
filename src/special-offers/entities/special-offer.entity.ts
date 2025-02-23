import { SPECIAL_OFFER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('special_offers')
export class SpecialOfferEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  spo_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  spo_res_id?: string

  @Column('varchar', { length: 255 })
  spo_title?: string

  @Column('varchar', { length: 255 })
  spo_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  spo_status?: string
}

@EventSubscriber()
export class SpecialOfferSubscriber implements EntitySubscriberInterface<SpecialOfferEntity> {
  listenTo() {
    return SpecialOfferEntity
  }

  async afterInsert(event: InsertEvent<SpecialOfferEntity>): Promise<void> {
    await addDocToElasticsearch(SPECIAL_OFFER_ELASTICSEARCH_INDEX, event.entity.spo_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<SpecialOfferEntity>): Promise<void> {
    await updateDocByElasticsearch(SPECIAL_OFFER_ELASTICSEARCH_INDEX, event.entity.spo_id, event.entity)
  }
}
