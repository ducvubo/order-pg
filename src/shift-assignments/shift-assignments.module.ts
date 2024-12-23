import { Module } from '@nestjs/common'
import { ShiftAssignmentsService } from './shift-assignments.service'
import { ShiftAssignmentsController } from './shift-assignments.controller'
import { ShiftAssignmentQuery } from './entity/shift-assignment.query'
import { ShiftAssignmentRepo } from './entity/shift-assignment.repo'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ShiftAssignmentEntity } from './entity/shift-assignments.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ShiftAssignmentEntity])],
  controllers: [ShiftAssignmentsController],
  providers: [ShiftAssignmentsService, ShiftAssignmentQuery, ShiftAssignmentRepo]
})
export class ShiftAssignmentsModule {}
