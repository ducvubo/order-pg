import { Injectable } from '@nestjs/common'
import { ShiftAssignmentRepo } from './entity/shift-assignment.repo'
import { ShiftAssignmentQuery } from './entity/shift-assignment.query'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'

@Injectable()
export class ShiftAssignmentsService {
  constructor(
    private readonly shiftAssignmentRepo: ShiftAssignmentRepo,
    private readonly shiftAssignmentQuery: ShiftAssignmentQuery
  ) {}

  async createShiftAssignment(createShiftAssignmentDto: CreateShiftAssignmentDto, account: IAccount) {
    try {
    } catch (error) {
      saveLogSystem({
        action: 'createShiftAssignment',
        class: 'ShiftAssignmentsService',
        function: 'createShiftAssignment',
        message: error.message,
        time: new Date(),
        type: 'error',
        error: error
      })
    }
  }
}
