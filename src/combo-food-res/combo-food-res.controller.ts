import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common'
import { ComboFoodResService } from './combo-food-res.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateFoodComboResDto } from './dto/create-food-combo-res.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { FoodComboResEntity } from './entities/combo-food-res.entity'
import { UpdateFoodComboResDto } from './dto/update-food-combo-res.dto'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateResult } from 'typeorm'
import { UpdateStatusFoodComboResDto } from './dto/update-status-food-combo-res.dto'
import { UpdateStateFoodComboResDto } from './dto/update-state-food-combo-res.dto'
import { Request as RequestExpress } from 'express'

@Controller('combo-food-res')
export class ComboFoodResController {
  constructor(private readonly comboFoodResService: ComboFoodResService) { }

  @Post()
  @ResponseMessage('Thêm combo thành công')
  @UseGuards(AccountAuthGuard)
  async createComboFoodRes(
    @Body() createFoodComboResDto: CreateFoodComboResDto,
    @Acccount() account: IAccount
  ): Promise<FoodComboResEntity> {
    return await this.comboFoodResService.createComboFoodRes(createFoodComboResDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật combo thành công')
  @UseGuards(AccountAuthGuard)
  async updateComboFoodRes(
    @Body() updateFoodComboResDto: UpdateFoodComboResDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.comboFoodResService.updateComboFoodRes(updateFoodComboResDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách combo thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('fcb_name') fcb_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<FoodComboResEntity>> {
    return await this.comboFoodResService.findAll({ pageSize: +pageSize, pageIndex: +pageIndex, fcb_name }, account)
  }

  @Get('/get-combo-by-slug/:fcb_slug')
  @ResponseMessage('Lấy thông tin combo thành công')
  async findOneBySlug(@Param('fcb_slug') fcb_slug: string): Promise<FoodComboResEntity> {
    return await this.comboFoodResService.getFoodComboBySlug(fcb_slug)
  }

  @Post('/add-combo-food-to-cart')
  @ResponseMessage('Thêm combo món ăn vào giỏ hàng thành công')
  async addFoodToCart(@Query('fcb_id') fcb_id: string, @Request() req: RequestExpress): Promise<boolean> {
    return await this.comboFoodResService.addComboFoodToCart({ fcb_id, id_user_guest: req.headers['x-cl-id'] as string })
  }

  @Get('/list-combo-food/:combo_food_res_id')
  @ResponseMessage('Lấy danh sách món ăn thành công')
  async findFoodRestaurants(@Param('combo_food_res_id') combo_food_res_id: string): Promise<FoodComboResEntity[]> {
    return await this.comboFoodResService.findComboFoodRestaurants(combo_food_res_id)
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái combo thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusComboFoodRes(
    @Body() updateStatusFoodComboResDto: UpdateStatusFoodComboResDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.comboFoodResService.updateStatusComboFoodRes(updateStatusFoodComboResDto, account)
  }

  @Patch('update-state')
  @ResponseMessage('Cập nhật trạng thái combo thành công')
  @UseGuards(AccountAuthGuard)
  async updateStateComboFoodRes(
    @Body() updateStateFoodComboResDto: UpdateStateFoodComboResDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.comboFoodResService.updateStateComboFoodRes(updateStateFoodComboResDto, account)
  }

  @Patch('restore/:fcb_id')
  @ResponseMessage('Khôi phục combo thành công')
  @UseGuards(AccountAuthGuard)
  async restoreComboFoodRes(@Param('fcb_id') fcb_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.comboFoodResService.restoreComboFoodRes(fcb_id, account)
  }

  @Get('recycle')
  @ResponseMessage('Lấy danh sách combo đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('fcb_name') fcb_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<FoodComboResEntity>> {
    return await this.comboFoodResService.findRecycle({ pageSize: +pageSize, pageIndex: +pageIndex, fcb_name }, account)
  }

  @Delete(':fcb_id')
  @ResponseMessage('Xóa combo thành công')
  @UseGuards(AccountAuthGuard)
  async deleteComboFoodRes(@Param('fcb_id') fcb_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.comboFoodResService.deleteComboFoodRes(fcb_id, account)
  }

  @Get(':fcb_id')
  @ResponseMessage('Lấy thông tin combo thành công')
  @UseGuards(AccountAuthGuard)
  async findOne(
    @Param('fcb_id') fcb_id: string,
    @Acccount() account: IAccount
  ): Promise<FoodComboResEntity & { food_items: { food_id: string; food_quantity: number }[] }> {
    return await this.comboFoodResService.findOne(fcb_id, account)
  }
}
