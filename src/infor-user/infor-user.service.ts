import { Injectable } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { DeleteResult, UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { InforUserRepo } from './entities/infor-user.repo'
import { InforUserQuery } from './entities/infor-user.query'
import { CreateInforUserDto } from './dto/create-infor-user.dto'
import { InforUserEntity } from './entities/infor-user.entity'
import { UpdateInforUserDto } from './dto/update-infor-user.dto'

@Injectable()
export class InforUserService {
  constructor(
    private readonly inforUserRepo: InforUserRepo,
    private readonly inforUserQuery: InforUserQuery
  ) { }

  async createInforUser(
    createInforUserDto: CreateInforUserDto,
    ifuser_guest_id: string
  ): Promise<InforUserEntity> {
    try {
      return this.inforUserRepo.createInforUser({
        ifuser_guest_id,
        ifuser_name: createInforUserDto.ifuser_name,
        ifuser_phone: createInforUserDto.ifuser_phone,
        ifuser_email: createInforUserDto.ifuser_email,
        ifuser_address: createInforUserDto.ifuser_address,
        ifuser_province_id: createInforUserDto.ifuser_province_id,
        ifuser_district_id: createInforUserDto.ifuser_district_id,
        ifuser_ward_id: createInforUserDto.ifuser_ward_id,
        ifuser_province_name: createInforUserDto.ifuser_province_name,
        ifuser_district_name: createInforUserDto.ifuser_district_name,
        ifuser_ward_name: createInforUserDto.ifuser_ward_name,
        ifuser_longitude: createInforUserDto.ifuser_longitude,
        ifuser_latitude: createInforUserDto.ifuser_latitude,
      })
    } catch (error) {
      saveLogSystem({
        action: 'createInforUser',
        class: 'InforUserService',
        function: 'createInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(ifuser_id: string, ifuser_guest_id: string): Promise<InforUserEntity | null> {
    try {
      return this.inforUserQuery.findOneById(ifuser_guest_id, ifuser_id)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'InforUserService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateInforUser(updateInforUserDto: UpdateInforUserDto, ifuser_guest_id: string): Promise<UpdateResult> {
    try {
      const inforUserExist = await this.inforUserQuery.findOneById(ifuser_guest_id, updateInforUserDto.ifuser_id)
      if (!inforUserExist) {
        throw new BadRequestError('Thông tin người dùng menu không tồn tại')
      }
      return this.inforUserRepo.updateInforUser({
        ifuser_guest_id,
        ifuser_name: updateInforUserDto.ifuser_name,
        ifuser_phone: updateInforUserDto.ifuser_phone,
        ifuser_email: updateInforUserDto.ifuser_email,
        ifuser_address: updateInforUserDto.ifuser_address,
        ifuser_province_id: updateInforUserDto.ifuser_province_id,
        ifuser_district_id: updateInforUserDto.ifuser_district_id,
        ifuser_ward_id: updateInforUserDto.ifuser_ward_id,
        ifuser_province_name: updateInforUserDto.ifuser_province_name,
        ifuser_district_name: updateInforUserDto.ifuser_district_name,
        ifuser_ward_name: updateInforUserDto.ifuser_ward_name,
        ifuser_longitude: updateInforUserDto.ifuser_longitude,
        ifuser_latitude: updateInforUserDto.ifuser_latitude,
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateInforUser',
        class: 'InforUserService',
        function: 'updateInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteInforUser(ifuser_id: string, ifuser_guest_id: string): Promise<DeleteResult> {
    try {
      const inforUserExist = await this.inforUserQuery.findOneById(ifuser_guest_id, ifuser_id)
      if (!inforUserExist) {
        throw new BadRequestError('Thông tin người dùng menu không tồn tại')
      }
      return this.inforUserRepo.deleteInforUser(ifuser_id)
    } catch (error) {
      saveLogSystem({
        action: 'deleteInforUser',
        class: 'InforUserService',
        function: 'deleteInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(ifuser_guest_id: string): Promise<InforUserEntity[]> {
    try {
      return this.inforUserQuery.findAll(ifuser_guest_id)
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'InforUserService',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
