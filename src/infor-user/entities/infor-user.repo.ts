import { DeleteResult, Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, deleteDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { InforUserEntity } from './infor-user.entity'
import { INFOR_USER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { getElasticsearch } from 'src/config/elasticsearch.config'

@Injectable()
export class InforUserRepo implements OnModuleInit {
  constructor(
    @InjectRepository(InforUserEntity)
    private readonly inforUserRepository: Repository<InforUserEntity>,
    private readonly configService: ConfigService
  ) { }

  private readonly elasticSearch = getElasticsearch().instanceConnect

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: InforUserEntity[] = await this.inforUserRepository.find()
    const indexExist = await indexElasticsearchExists(INFOR_USER_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(INFOR_USER_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(INFOR_USER_ELASTICSEARCH_INDEX, doc.ifuser_id.toString(), doc)
    }
  }

  async createInforUser(inforUser: InforUserEntity): Promise<InforUserEntity> {
    try {
      return this.inforUserRepository.save(inforUser)
    } catch (error) {
      saveLogSystem({
        action: 'createInforUser',
        class: 'InforUserRepo',
        function: 'createInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateInforUser(inforUser: InforUserEntity): Promise<UpdateResult> {
    try {
      return await this.inforUserRepository
        .createQueryBuilder()
        .update(InforUserEntity)
        .set({
          ifuser_name: inforUser.ifuser_name,
          ifuser_phone: inforUser.ifuser_phone,
          ifuser_email: inforUser.ifuser_email,
          ifuser_address: inforUser.ifuser_address,
          ifuser_province_id: inforUser.ifuser_province_id,
          ifuser_district_id: inforUser.ifuser_district_id,
          ifuser_ward_id: inforUser.ifuser_ward_id,
          ifuser_province_name: inforUser.ifuser_province_name,
          ifuser_district_name: inforUser.ifuser_district_name,
          ifuser_ward_name: inforUser.ifuser_ward_name,
          ifuser_longitude: inforUser.ifuser_longitude,
          ifuser_latitude: inforUser.ifuser_latitude,
          updatedBy: inforUser.updatedBy,
          ifuser_id: inforUser.ifuser_id
        })
        .where({
          ifuser_id: inforUser.ifuser_id,
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateInforUser',
        class: 'InforUserRepo',
        function: 'updateInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteInforUser(ifuser_id: string): Promise<DeleteResult> {
    try {
      const deleted = await this.inforUserRepository.delete({
        ifuser_id: ifuser_id,
      })
      await deleteDocByElasticsearch(INFOR_USER_ELASTICSEARCH_INDEX, ifuser_id)
      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteInforUser',
        class: 'InforUserRepo',
        function: 'deleteInforUser',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
