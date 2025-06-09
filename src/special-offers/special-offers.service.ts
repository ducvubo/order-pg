import { Injectable } from '@nestjs/common'
import { SpecialOfferQuery } from './entities/special-offer.query'
import { SpecialOfferRepo } from './entities/special-offer.repo'
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { SpecialOfferEntity } from './entities/special-offer.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { buidByAccount } from 'src/utils'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStatusSpecialOfferDto } from './dto/update-status-special-offer.dto'
import { sendMessageToKafka } from 'src/utils/kafka'
import { deleteCacheIO, getCacheIO, setCacheIO } from 'src/utils/cache'
import { KEY_HONE_PAGE_LIST_SPECIAL_OFFERS } from 'src/constants/key.redis'

@Injectable()
export class SpecialOffersService {
  constructor(
    private readonly specialOfferQuery: SpecialOfferQuery,
    private readonly specialOfferRepo: SpecialOfferRepo
  ) { }

  async createSpecialOffer(
    createSpecialOfferDto: CreateSpecialOfferDto,
    account: IAccount
  ): Promise<SpecialOfferEntity> {
    try {
      const special = await this.specialOfferRepo.createSpecialOffer({
        spo_res_id: account.account_restaurant_id,
        spo_title: createSpecialOfferDto.spo_title,
        spo_description: createSpecialOfferDto.spo_description,
        createdBy: buidByAccount(account),
        updatedBy: buidByAccount(account)
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Ưu đãi ${createSpecialOfferDto.spo_title} vừa được thêm mới`,
          noti_title: `Ưu đãi`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await deleteCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${account.account_restaurant_id}`)

      return special
    } catch (error) {
      saveLogSystem({
        action: 'createSpecialOffer',
        class: 'SpecialOffersService',
        function: 'createSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(spo_id: string, account: IAccount): Promise<SpecialOfferEntity> {
    try {
      return await this.specialOfferQuery.findOne(spo_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'SpecialOffersService',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateSpecialOffer(updateSpecialOfferDto: UpdateSpecialOfferDto, account: IAccount): Promise<UpdateResult> {
    try {
      const specialOfferExist = await this.specialOfferQuery.findOne(updateSpecialOfferDto.spo_id, account)
      if (!specialOfferExist) {
        throw new BadRequestError('Ưu đãi không tồn tại')
      }
      const update = await this.specialOfferRepo.updateSpecialOffer({
        spo_title: updateSpecialOfferDto.spo_title,
        spo_description: updateSpecialOfferDto.spo_description,
        updatedBy: buidByAccount(account),
        spo_res_id: account.account_restaurant_id,
        spo_id: updateSpecialOfferDto.spo_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Ưu đãi ${updateSpecialOfferDto.spo_title} vừa được cập nhật`,
          noti_title: `Ưu đãi`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${account.account_restaurant_id}`)
      return update

    } catch (error) {
      saveLogSystem({
        action: 'updateSpecialOffer',
        class: 'SpecialOfferService',
        function: 'updateSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteSpecialOffer(spo_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const specialOfferExist = await this.specialOfferQuery.findOne(spo_id, account)
      if (!specialOfferExist) {
        throw new BadRequestError('Ưu đãi không tồn tại')
      }
      const deleted = await this.specialOfferRepo.removeSpecialOffer(spo_id, account.account_restaurant_id, buidByAccount(account))

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Ưu đãi ${specialOfferExist.spo_title} vừa được xóa`,
          noti_title: `Ưu đãi`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${account.account_restaurant_id}`)
      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteSpecialOffer',
        class: 'SpecialOfferService',
        function: 'deleteSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreSpecialOffer(spo_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const specialOfferExist = await this.specialOfferQuery.findOne(spo_id, account)
      if (!specialOfferExist) {
        throw new BadRequestError('Đơn vị đo không tồn tại')
      }
      const restore = await this.specialOfferRepo.restoreSpecialOffer(spo_id, account.account_restaurant_id, buidByAccount(account))
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Ưu đãi ${specialOfferExist.spo_title} vừa được khôi phục`,
          noti_title: `Ưu đãi`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${account.account_restaurant_id}`)
      return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreSpecialOffer',
        class: 'SpecialOfferService',
        function: 'restoreSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusSpecialOffer(
    updateStatusSpecialOfferDto: UpdateStatusSpecialOfferDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const specialOfferExist = await this.specialOfferQuery.findOne(updateStatusSpecialOfferDto.spo_id, account)
      if (!specialOfferExist) {
        throw new BadRequestError('Ưu đãi không tồn tại')
      }
      const update = await this.specialOfferRepo.updateStatusSpecialOffer({
        spo_id: updateStatusSpecialOfferDto.spo_id,
        spo_res_id: account.account_restaurant_id,
        spo_status: updateStatusSpecialOfferDto.spo_status,
        updatedBy: buidByAccount(account)
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Ưu đãi ${specialOfferExist.spo_title} vừa được cập nhật trạng thái`,
          noti_title: `Ưu đãi`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${account.account_restaurant_id}`)
      return update

    } catch (error) {
      saveLogSystem({
        action: 'updateStatusSpecialOffer',
        class: 'SpecialOfferService',
        function: 'updateStatusSpecialOffer',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      spo_title
    }: {
      pageSize: number
      pageIndex: number
      spo_title: string
    },
    account: IAccount
  ): Promise<ResultPagination<SpecialOfferEntity>> {
    try {
      if (!spo_title && typeof spo_title !== 'string') {
        throw new BadRequestError('Ưu đãi không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      return await this.specialOfferQuery.findAllPagination({ pageSize, pageIndex, spo_title, isDeleted: 0 }, account)
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'SpecialOffersService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findRecycle(
    {
      pageSize,
      pageIndex,
      spo_title
    }: {
      pageSize: number
      pageIndex: number
      spo_title: string
    },
    account: IAccount
  ): Promise<ResultPagination<SpecialOfferEntity>> {
    try {
      if (!spo_title && typeof spo_title !== 'string') {
        throw new BadRequestError('Ưu đãi không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      return await this.specialOfferQuery.findAllPagination({ pageSize, pageIndex, spo_title, isDeleted: 1 }, account)
    } catch (error) {
      saveLogSystem({
        action: 'findRecycle',
        class: 'SpecialOffersService',
        function: 'findRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findSpecialOffers(spo_res_id: string): Promise<SpecialOfferEntity[]> {
    try {
      const listSpecialOffer = await getCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${spo_res_id}`)
      if (listSpecialOffer) {
        console.log('Data from cache');
        return listSpecialOffer
      }
      const data = await this.specialOfferQuery.findSpecialOffers(spo_res_id)
      await setCacheIO(`${KEY_HONE_PAGE_LIST_SPECIAL_OFFERS}_${spo_res_id}`, data)
      console.log('Data from database');
      return data
    } catch (error) {
      saveLogSystem({
        action: 'findSpecialOffers',
        class: 'SpecialOffersService',
        function: 'findSpecialOffers',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
