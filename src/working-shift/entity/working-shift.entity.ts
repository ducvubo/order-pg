import { WORKING_SHIFT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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

@Entity('working_shift')
export class WorkingShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  wks_id?: string = uuidv4()

  @Column('char', { length: 36 })
  wks_res_id?: string

  @Column('varchar', { length: 255 })
  wks_name?: string

  @Column('longtext')
  wks_description?: string

  @Column('time')
  wks_start_time?: string

  @Column('time')
  wks_end_time?: string

  @Column('varchar', { length: 255, default: 'enable' }) // enable: hiển thị, disable: ẩn
  wks_status?: string

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
export class WorkingShiftSubscriber implements EntitySubscriberInterface<WorkingShiftEntity> {
  listenTo() {
    return WorkingShiftEntity
  }

  async afterInsert(event: InsertEvent<WorkingShiftEntity>): Promise<void> {
    await addDocToOpenSearch(WORKING_SHIFT_ELASTICSEARCH_INDEX, event.entity.wks_id, event.entity)
  }
  async afterUpdate(event: UpdateEvent<WorkingShiftEntity>): Promise<void> {
    return await updateDocByOpenSearch(WORKING_SHIFT_ELASTICSEARCH_INDEX, event.entity.wks_id, event.entity)
  }
}
