import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm'

export class SampleEntity {
  @CreateDateColumn({ type: 'date' })
  createdAt?: Date

  @UpdateDateColumn({ type: 'date' })
  updatedAt?: Date

  @DeleteDateColumn({ type: 'date' })
  deletedAt?: Date

  @Column({ type: 'int', default: 0 }) // 0: chưa xóa, 1: đã xóa
  isDeleted?: 0 | 1

  @Column('varchar', { length: 36, nullable: true })
  createdBy?: string

  @Column('varchar', { length: 36, nullable: true })
  updatedBy?: string

  @Column('varchar', { length: 36, nullable: true })
  deletedBy?: string
}
