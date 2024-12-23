import { Injectable } from '@nestjs/common'
import { WorkingShiftRepo } from './entity/working-shift.repo'
import { WorkingShiftQuery } from './entity/working-shift.query'
import { CreateWorkingShiftDto } from './dto/create-working-shit.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { WorkingShiftEntity } from './entity/working-shift.entity'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateResult } from 'typeorm'
import { UpdateWorkingShiftDto } from './dto/update-working-shift.dto'
import { UpdateStatusWorkingShiftDto } from './dto/update-status-working-shit.dto'

@Injectable()
export class WorkingShiftService {
  constructor(
    private readonly workingShiftRepo: WorkingShiftRepo,
    private readonly workingShiftQuery: WorkingShiftQuery
  ) {}

  async createWorkingShift(
    createWorkingShiftDto: CreateWorkingShiftDto,
    account: IAccount
  ): Promise<WorkingShiftEntity> {
    try {
      const { wks_description, wks_end_time, wks_name, wks_start_time } = createWorkingShiftDto

      return await this.workingShiftRepo.createWorkingShift({
        wks_name,
        wks_description,
        wks_res_id: account.account_restaurant_id,
        wks_start_time,
        wks_end_time,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createWorkingShift',
        class: 'WorkingShiftService',
        function: 'createWorkingShift',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    { wks_name, pageSize, pageIndex }: { wks_name: string; pageSize: number; pageIndex: number },
    account: IAccount
  ): Promise<ResultPagination<WorkingShiftEntity[]>> {
    try {
      if (!wks_name && typeof wks_name !== 'string') {
        throw new BadRequestError('Tên ca làm việc không hợp lệ!!!')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      return await this.workingShiftQuery.findAllPagination({ wks_name, pageSize, pageIndex, isDeleted: 0 }, account)
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'WorkingShiftService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(id: string, account: IAccount): Promise<WorkingShiftEntity> {
    try {
      return await this.workingShiftQuery.findOne(id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'WorkingShiftService',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async update(updateWorkingShiftDto: UpdateWorkingShiftDto, account: IAccount): Promise<UpdateResult> {
    try {
      const { wks_id, wks_description, wks_end_time, wks_name, wks_start_time } = updateWorkingShiftDto
      const workingShitfExist = await this.workingShiftQuery.findOne(wks_id, account)
      if (!workingShitfExist) {
        throw new BadRequestError('Ca làm việc không tồn tại!!!')
      }
      return await this.workingShiftRepo.updateWorkingShift(
        {
          wks_id,
          wks_name,
          wks_description,
          wks_start_time,
          wks_end_time,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        },
        account
      )
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'WorkingShiftService',
        function: 'update',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async remove(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const workingShitfExist = await this.workingShiftQuery.findOne(id, account)

      if (!workingShitfExist) {
        throw new BadRequestError('Ca làm việc không tồn tại!!!')
      }

      return await this.workingShiftRepo.removeWorkingShift(id, account)
    } catch (error) {
      saveLogSystem({
        action: 'remove',
        class: 'WorkingShiftService',
        function: 'remove',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restore(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const workingShitfExist = await this.workingShiftQuery.findOne(id, account)

      if (!workingShitfExist) {
        throw new BadRequestError('Ca làm việc không tồn tại!!!')
      }

      return await this.workingShiftRepo.restoreWorkingShift(id, account)
    } catch (error) {
      saveLogSystem({
        action: 'restore',
        class: 'WorkingShiftService',
        function: 'restore',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatus(
    updateStatusWorkingShiftDto: UpdateStatusWorkingShiftDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const { wks_id, wks_status } = updateStatusWorkingShiftDto
      const workingShitfExist = await this.workingShiftQuery.findOne(wks_id, account)

      if (!workingShitfExist) {
        throw new BadRequestError('Ca làm việc không tồn tại!!!')
      }

      return await this.workingShiftRepo.updateStatusWorkingShift(wks_id, wks_status, account)
    } catch (error) {
      saveLogSystem({
        action: 'updateStatus',
        class: 'WorkingShiftService',
        function: 'updateStatus',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findRecycle(
    { wks_name, pageSize, pageIndex }: { wks_name: string; pageSize: number; pageIndex: number },
    account: IAccount
  ): Promise<ResultPagination<WorkingShiftEntity[]>> {
    try {
      if (!wks_name && typeof wks_name !== 'string') {
        throw new BadRequestError('Tên ca làm việc không hợp lệ!!!')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      return await this.workingShiftQuery.findAllPagination({ wks_name, pageSize, pageIndex, isDeleted: 1 }, account)
    } catch (error) {
      saveLogSystem({
        action: 'findRecycle',
        class: 'WorkingShiftService',
        function: 'findRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
