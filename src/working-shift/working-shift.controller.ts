import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { WorkingShiftService } from './working-shift.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateWorkingShiftDto } from './dto/create-working-shit.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { WorkingShiftEntity } from './entity/working-shift.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateWorkingShiftDto } from './dto/update-working-shift.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStatusWorkingShiftDto } from './dto/update-status-working-shit.dto'

@Controller('working-shift')
export class WorkingShiftController {
  constructor(private readonly workingShiftService: WorkingShiftService) {}

  @Post()
  @ResponseMessage('Thêm ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async craeteWorkingShift(
    @Body() createWorkingShiftDto: CreateWorkingShiftDto,
    @Acccount() account: IAccount
  ): Promise<WorkingShiftEntity> {
    return await this.workingShiftService.createWorkingShift(createWorkingShiftDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('wks_name') wks_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<WorkingShiftEntity[]>> {
    return await this.workingShiftService.findAll({ wks_name, pageSize: +pageSize, pageIndex: +pageIndex }, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async update(
    @Body() updateWorkingShiftDto: UpdateWorkingShiftDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    console.log('updateWorkingShiftDto', updateWorkingShiftDto)
    return await this.workingShiftService.update(updateWorkingShiftDto, account)
  }

  @Get('recycle')
  @ResponseMessage('Lấy danh sách ca làm việc đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('wks_name') wks_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<WorkingShiftEntity[]>> {
    return await this.workingShiftService.findRecycle({ wks_name, pageSize: +pageSize, pageIndex: +pageIndex }, account)
  }

  @Patch('restore/:id')
  @ResponseMessage('Khôi phục ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async restore(@Param('id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.workingShiftService.restore(id, account)
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatus(
    @Body() updateStatusWorkingShiftDto: UpdateStatusWorkingShiftDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.workingShiftService.updateStatus(updateStatusWorkingShiftDto, account)
  }

  @Delete('/:id')
  @ResponseMessage('Xóa ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async remove(@Param('id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.workingShiftService.remove(id, account)
  }

  @Get('/:id')
  @ResponseMessage('Lấy thông tin ca làm việc thành công')
  @UseGuards(AccountAuthGuard)
  async findOne(@Param('id') id: string, @Acccount() account: IAccount): Promise<WorkingShiftEntity> {
    return await this.workingShiftService.findOne(id, account)
  }
}
