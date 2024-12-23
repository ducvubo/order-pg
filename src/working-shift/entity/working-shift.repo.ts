import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToOpenSearch, deleteAllDocByOpenSearch, indexOpenSearchExists } from 'src/utils/open-search'
import { WORKING_SHIFT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { WorkingShiftEntity } from './working-shift.entity'
import { OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'

export class WorkingShiftRepo implements OnModuleInit {
  constructor(
    @InjectRepository(WorkingShiftEntity)
    private readonly workingShifRepository: Repository<WorkingShiftEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: WorkingShiftEntity[] = await this.workingShifRepository.find()
    const indexExist = await indexOpenSearchExists(WORKING_SHIFT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByOpenSearch(WORKING_SHIFT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToOpenSearch(WORKING_SHIFT_ELASTICSEARCH_INDEX, doc.wks_id.toString(), doc)
    }
  }

  async createWorkingShift(data: WorkingShiftEntity): Promise<WorkingShiftEntity> {
    try {
      return await this.workingShifRepository.save(data)
    } catch (error) {
      console.log('error', error)
      saveLogSystem({
        type: 'error',
        action: 'createWorkingShift',
        class: 'WorkingShiftRepo',
        function: 'createWorkingShift',
        message: error.message,
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateWorkingShift(data: WorkingShiftEntity, account: IAccount): Promise<UpdateResult> {
    try {
      const { wks_name, wks_start_time, wks_end_time, wks_description, updatedBy, wks_id } = data
      return await this.workingShifRepository
        .createQueryBuilder()
        .update(WorkingShiftEntity)
        .where({ wks_id: data?.wks_id, wks_res_id: account.account_restaurant_id })
        .set({
          wks_end_time,
          wks_name,
          wks_description,
          wks_start_time,
          updatedBy,
          wks_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'updateWorkingShift',
        class: 'WorkingShiftRepo',
        function: 'updateWorkingShift',
        message: error.message,
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async removeWorkingShift(wks_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.workingShifRepository
        .createQueryBuilder()
        .update(WorkingShiftEntity)
        .set({
          isDeleted: 1,
          wks_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({ wks_id, wks_res_id: account.account_restaurant_id })
        .execute()
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'removeWorkingShift',
        class: 'WorkingShiftRepo',
        function: 'removeWorkingShift',
        message: error.message,
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreWorkingShift(wks_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.workingShifRepository
        .createQueryBuilder()
        .update(WorkingShiftEntity)
        .set({
          isDeleted: 0,
          deletedBy: null,
          wks_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({ wks_id, wks_res_id: account.account_restaurant_id })
        .execute()
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'restoreWorkingShift',
        class: 'WorkingShiftRepo',
        function: 'restoreWorkingShift',
        message: error.message,
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusWorkingShift(
    wks_id: string,
    wks_status: 'enable' | 'disable',
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      return await this.workingShifRepository
        .createQueryBuilder()
        .update(WorkingShiftEntity)
        .where({ wks_id, wks_res_id: account.account_restaurant_id })
        .set({
          wks_id,
          wks_status: wks_status,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'updateStatusWorkingShift',
        class: 'WorkingShiftRepo',
        function: 'updateStatusWorkingShift',
        message: error.message,
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }
}
