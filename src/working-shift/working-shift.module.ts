import { Module } from '@nestjs/common'
import { WorkingShiftService } from './working-shift.service'
import { WorkingShiftController } from './working-shift.controller'
import { WorkingShiftQuery } from './entity/working-shift.query'
import { WorkingShiftRepo } from './entity/working-shift.repo'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WorkingShiftEntity } from './entity/working-shift.entity'

@Module({
  imports: [TypeOrmModule.forFeature([WorkingShiftEntity])],
  controllers: [WorkingShiftController],
  providers: [WorkingShiftService, WorkingShiftQuery, WorkingShiftRepo]
})
export class WorkingShiftModule {}
