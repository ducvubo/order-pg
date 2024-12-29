import { Repository, UpdateResult } from 'typeorm'
import { FoodComboResEntity } from './combo-food-res.entity'
import { InjectRepository } from '@nestjs/typeorm'

import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { FOOD_COMBO_RES_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusFoodComboResDto } from '../dto/update-status-food-combo-res.dto'
import { UpdateStateFoodComboResDto } from '../dto/update-state-food-combo-res.dto'

export class FoodComboResRepo implements OnModuleInit {
  constructor(
    @InjectRepository(FoodComboResEntity)
    private readonly foodComboResRepository: Repository<FoodComboResEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: FoodComboResEntity[] = await this.foodComboResRepository.find()
    const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(FOOD_COMBO_RES_ELASTICSEARCH_INDEX, doc.fcb_id.toString(), doc)
    }
  }

  async createComboFoodRes(foodComboRes: FoodComboResEntity): Promise<FoodComboResEntity> {
    return await this.foodComboResRepository.save(foodComboRes)
  }

  async deleteComboFoodRes(fcb_id: string, account: IAccount): Promise<UpdateResult> {
    return await this.foodComboResRepository
      .createQueryBuilder()
      .update(FoodComboResEntity)
      .set({
        isDeleted: 1,
        deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        deletedAt: new Date(),
        updatedAt: new Date(),

        fcb_id
      })
      .where({ fcb_id, fcb_res_id: account.account_restaurant_id })
      .execute()
  }

  async restoreComboFoodRes(fcb_id: string, account: IAccount): Promise<UpdateResult> {
    return await this.foodComboResRepository
      .createQueryBuilder()
      .update(FoodComboResEntity)
      .set({
        isDeleted: 0,
        deletedBy: null,
        deletedAt: null,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        fcb_id,
        updatedAt: new Date()
      })
      .where({ fcb_id, fcb_res_id: account.account_restaurant_id })
      .execute()
  }

  async updateStatusComboFoodRes(
    updateStatusFoodComboResDto: UpdateStatusFoodComboResDto,
    account: IAccount
  ): Promise<UpdateResult> {
    return await this.foodComboResRepository
      .createQueryBuilder()
      .update(FoodComboResEntity)
      .set({
        fcb_status: updateStatusFoodComboResDto.fcb_status,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        fcb_id: updateStatusFoodComboResDto.fcb_id,
        updatedAt: new Date()
      })
      .where({ fcb_id: updateStatusFoodComboResDto.fcb_id, fcb_res_id: account.account_restaurant_id })
      .execute()
  }

  async updateStateComboFoodRes(
    updateStateFoodComboResDto: UpdateStateFoodComboResDto,
    account: IAccount
  ): Promise<UpdateResult> {
    return await this.foodComboResRepository
      .createQueryBuilder()
      .update(FoodComboResEntity)
      .set({
        fcb_state: updateStateFoodComboResDto.fcb_state,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        fcb_id: updateStateFoodComboResDto.fcb_id,
        updatedAt: new Date()
      })
      .where({ fcb_id: updateStateFoodComboResDto.fcb_id, fcb_res_id: account.account_restaurant_id })
      .execute()
  }
}
