import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { SPECIAL_OFFER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { SpecialOfferEntity } from './special-offer.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'

@Injectable()
export class SpecialOfferRepo implements OnModuleInit {
  constructor(
    @InjectRepository(SpecialOfferEntity)
    private readonly SpecialOfferRepository: Repository<SpecialOfferEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: SpecialOfferEntity[] = await this.SpecialOfferRepository.find()
    const indexExist = await indexElasticsearchExists(SPECIAL_OFFER_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(SPECIAL_OFFER_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(SPECIAL_OFFER_ELASTICSEARCH_INDEX, doc.spo_id.toString(), doc)
    }
  }

  async createSpecialOffer(data: SpecialOfferEntity): Promise<SpecialOfferEntity> {
    try {
      return await this.SpecialOfferRepository.save(data)
    } catch (error) {
      saveLogSystem({
        action: 'createSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'createSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateSpecialOffer(specialOfferEntity: SpecialOfferEntity): Promise<UpdateResult> {
    try {
      return await this.SpecialOfferRepository.createQueryBuilder()
        .update(SpecialOfferEntity)
        .set(specialOfferEntity)
        .where({
          spo_id: specialOfferEntity.spo_id,
          spo_res_id: specialOfferEntity.spo_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'updateSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusSpecialOffer({
    spo_id,
    spo_res_id,
    spo_status,
    updatedBy
  }: {
    spo_id: string
    spo_res_id: string
    spo_status: 'enable' | 'disable'
    updatedBy: string
  }): Promise<UpdateResult> {
    try {
      return await this.SpecialOfferRepository.createQueryBuilder()
        .update(SpecialOfferEntity)
        .set({ spo_status, updatedBy, spo_id, updatedAt: new Date() })
        .where({
          spo_id,
          spo_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'updateStatusSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async removeSpecialOffer(spo_id: string, spo_res_id: string, deletedBy: string): Promise<UpdateResult> {
    try {
      return await this.SpecialOfferRepository.createQueryBuilder()
        .createQueryBuilder()
        .update(SpecialOfferEntity)
        .where({
          spo_id,
          spo_res_id,
          isDeleted: 0,
          updatedAt: new Date()
        })
        .set({
          spo_id,
          isDeleted: 1,
          deletedBy,
          deletedAt: new Date()
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'removeSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'removeSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreSpecialOffer(spo_id: string, spo_res_id: string, updatedBy: string): Promise<UpdateResult> {
    try {
      return await this.SpecialOfferRepository.createQueryBuilder()
        .createQueryBuilder()
        .update(SpecialOfferEntity)
        .where({
          spo_id,
          spo_res_id,
          isDeleted: 1,
          updatedAt: new Date()
        })
        .set({
          spo_id,
          isDeleted: 0,
          updatedBy,
          updatedAt: new Date()
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'restoreSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async totalSpecialOffer(spo_res_id: string): Promise<number> {
    try {
      return await this.SpecialOfferRepository.count({
        where: {
          spo_res_id,
          spo_status: 'enable'
        }
      })
    } catch (error) {
      saveLogSystem({
        action: 'totalSpecialOffer',
        class: 'SpecialOfferRepo',
        function: 'totalSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

}
