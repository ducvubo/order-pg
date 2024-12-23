import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ShiftAssignmentsService } from './shift-assignments.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto'
import { IAccount } from 'src/guard/interface/account.interface'

@Controller('shift-assignments')
export class ShiftAssignmentsController {
  constructor(private readonly shiftAssignmentsService: ShiftAssignmentsService) {}

  @Post()
  @ResponseMessage('Thêm phân công công việc')
  @UseGuards(AccountAuthGuard)
  async create(@Body() createShiftAssignmentDto: CreateShiftAssignmentDto, @Acccount() account: IAccount) {
    return this.shiftAssignmentsService.createShiftAssignment(createShiftAssignmentDto, account)
  }
}
