import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { FoodRestaurantService } from './food-restaurant.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { CreateFoodRestaurantDto } from './dto/create-food-restaurant.dto'
import { FoodRestaurantEntity } from './entity/food-restaurant.entity'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateFoodRestaurantDto } from './dto/update-food-restaurant.dto'
import { UpdateStatusFoodRestaurantDto } from './dto/update-status-food-restaurant.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStateFoodRestaurantDto } from './dto/update-state-food-restaurant.dto'

@Controller('food-restaurant')
export class FoodRestaurantController {
  constructor(private readonly foodRestaurantService: FoodRestaurantService) {}

  @Post()
  @ResponseMessage('Tạo món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async create(
    @Body() createFoodRestaurantDto: CreateFoodRestaurantDto,
    @Acccount() account: IAccount
  ): Promise<FoodRestaurantEntity> {
    return await this.foodRestaurantService.create(createFoodRestaurantDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('food_name') food_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity[]>> {
    return await this.foodRestaurantService.findAll({ food_name, pageSize: +pageSize, pageIndex: +pageIndex }, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async update(
    @Body() updateFoodRestaurantDto: UpdateFoodRestaurantDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.foodRestaurantService.update(updateFoodRestaurantDto, account)
  }

  @Get('recycle')
  @ResponseMessage('Lấy danh sách món ăn đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('food_name') food_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity[]>> {
    return await this.foodRestaurantService.findRecycle(
      { food_name, pageSize: +pageSize, pageIndex: +pageIndex },
      account
    )
  }

  @Patch('/update-status')
  @ResponseMessage('Cập nhật trạng thái món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatus(
    @Body() updateStatusFoodRestaurantDto: UpdateStatusFoodRestaurantDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.foodRestaurantService.updateStatus(updateStatusFoodRestaurantDto, account)
  }

  @Patch('update-state')
  @ResponseMessage('Cập nhật trạng thái món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async updateState(
    @Body() updateStateFoodRestaurantDto: UpdateStateFoodRestaurantDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.foodRestaurantService.updateState(updateStateFoodRestaurantDto, account)
  }

  @Patch('restore/:id')
  @ResponseMessage('Khôi phục món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async restore(@Param('id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.foodRestaurantService.restore(id, account)
  }

  @Get('/:id')
  @ResponseMessage('Lấy thông tin món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async findOne(@Param('id') id: string, @Acccount() account: IAccount): Promise<FoodRestaurantEntity> {
    return await this.foodRestaurantService.findOne(id, account)
  }

  @Delete('/:id')
  @ResponseMessage('Xóa món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async remove(@Param('id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.foodRestaurantService.remove(id, account)
  }
}
