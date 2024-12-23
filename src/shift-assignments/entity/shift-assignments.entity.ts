import { SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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

@Entity('shift-assigntment')
export class ShiftAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  sasm_id?: string = uuidv4()

  @Column('char', { length: 36 })
  sasm_res_id?: string

  @Column('char', { length: 36 })
  sasm_wks_id?: string

  @Column('char', { length: 36 })
  sasm_epl_id?: string

  @Column('json')
  sasm_todo_task?: string

  @Column('longtext')
  sasm_note?: string

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
export class ShiftAssignmentSubscriber implements EntitySubscriberInterface<ShiftAssignmentEntity> {
  listenTo() {
    return ShiftAssignmentEntity
  }

  async afterInsert(event: InsertEvent<ShiftAssignmentEntity>): Promise<void> {
    await addDocToOpenSearch(SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX, event.entity.sasm_id, event.entity)
  }
  async afterUpdate(event: UpdateEvent<ShiftAssignmentEntity>): Promise<void> {
    return await updateDocByOpenSearch(SHIFT_ASSIGNMENT_ELASTICHSEARCH_INDEX, event.entity.sasm_id, event.entity)
  }
}
