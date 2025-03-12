import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { SpecialOffersService } from './special-offers.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto'
import { SpecialOfferEntity } from './entities/special-offer.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateStatusSpecialOfferDto } from './dto/update-status-special-offer.dto'

@Controller('special-offers')
export class SpecialOffersController {
  constructor(private readonly specialOffersService: SpecialOffersService) { }

  @Post()
  @ResponseMessage('Thêm ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async createSpecialOffer(
    @Body() createSpecialOfferDto: CreateSpecialOfferDto,
    @Acccount() account: IAccount
  ): Promise<SpecialOfferEntity> {
    return this.specialOffersService.createSpecialOffer(createSpecialOfferDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async updateSpecialOffer(
    @Body() updateSpecialOfferDto: UpdateSpecialOfferDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.specialOffersService.updateSpecialOffer(updateSpecialOfferDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('spo_title') spo_title: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<SpecialOfferEntity>> {
    return await this.specialOffersService.findAll(
      {
        spo_title,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('/list-special-offer/:spo_res_id')
  @ResponseMessage('Lấy danh sách ưu đãi thành công')
  async findSpecialOffers(@Param('spo_res_id') spo_res_id: string): Promise<SpecialOfferEntity[]> {
    return await this.specialOffersService.findSpecialOffers(spo_res_id)
  }


  @Get('/recycle')
  @ResponseMessage('Lấy danh sách ưu đãi đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('spo_title') spo_title: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<SpecialOfferEntity>> {
    return await this.specialOffersService.findRecycle(
      {
        spo_title,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusSpecialOffer(
    @Body() updateStatusSpecialOfferDto: UpdateStatusSpecialOfferDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.specialOffersService.updateStatusSpecialOffer(updateStatusSpecialOfferDto, account)
  }

  @Patch('restore/:spo_id')
  @ResponseMessage('Khôi phục ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async restoreSpecialOffer(@Param('spo_id') spo_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.specialOffersService.restoreSpecialOffer(spo_id, account)
  }

  @Delete(':spo_id')
  @ResponseMessage('Xóa ưu đãi thành công')
  @UseGuards(AccountAuthGuard)
  async deleteSpecialOffer(@Param('spo_id') spo_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.specialOffersService.deleteSpecialOffer(spo_id, account)
  }

  @Get(':spo_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin ưu đãi thành công')
  async findOneById(@Param('spo_id') spo_id: string, @Acccount() account: IAccount): Promise<SpecialOfferEntity> {
    return this.specialOffersService.findOne(spo_id, account)
  }
}
