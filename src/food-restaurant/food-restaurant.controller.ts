import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FoodRestaurantService } from './food-restaurant.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { CreateFoodRestaurantDto } from './dto/create-food-restaurant.dto'
import { FoodRestaurantEntity } from './entities/food-restaurant.entity'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateFoodRestaurantDto } from './dto/update-food-restaurant.dto'
import { UpdateStatusFoodRestaurantDto } from './dto/update-status-food-restaurant.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStateFoodRestaurantDto } from './dto/update-state-food-restaurant.dto'
import { Request as RequestExpress } from 'express'
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('food-restaurant')
export class FoodRestaurantController {
  constructor(private readonly foodRestaurantService: FoodRestaurantService) { }

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
  ): Promise<ResultPagination<FoodRestaurantEntity>> {
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

  @Post('/import-food-image')
  @ApiOperation({ summary: 'Nhận diện món ăn từ ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tải lên ảnh menu để nhận diện',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('Nhận diện món ăn từ ảnh thành công')
  async importMenuImage(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new Error('Không có file được tải lên');
    }
    return await this.foodRestaurantService.extractMenuFromImage(file.buffer);
  }

  //findAllPaginationListFood
  @Get('list-food-by-all')
  @ResponseMessage('Lấy danh sách món ăn thành công')
  @ApiQuery({ name: 'pageIndex', required: true, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'pageSize', required: true, type: Number, description: 'Số lượng phần tử mỗi trang' })
  @ApiOkResponse({
    description: 'Danh sách món ăn phân trang'
  })
  async findAllPaginationListFood(
    @Query('pageIndex') pageIndex: string,
    @Query('pageSize') pageSize: string
  ): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: FoodRestaurantEntity[]
  }> {
    return await this.foodRestaurantService.findAllPaginationListFood({ pageSize: +pageSize, pageIndex: +pageIndex })
  }

  @Get('/get-food-res-slug/:food_slug')
  @ResponseMessage('Lấy món ăn theo slug thành công')
  async getFoodResSlug(@Param('food_slug') food_slug: string): Promise<FoodRestaurantEntity> {
    return await this.foodRestaurantService.getFoodRestaurantBySlug(food_slug)
  }

  @Get('get-food-id/:food_id')
  @ResponseMessage('Lấy món ăn theo id thành công')
  async getFoodId(@Param('food_id') food_id: string): Promise<FoodRestaurantEntity> {
    return await this.foodRestaurantService.getFoodRestaurantById(food_id)
  }

  @Get('/get-cart-food')
  @ResponseMessage('Lấy danh sách món ăn trong giỏ hàng thành công')
  async getCartFood(@Request() req: RequestExpress): Promise<FoodRestaurantEntity[]> {
    return await this.foodRestaurantService.getFoodRestaurantCart(req.headers['x-cl-id'] as string)
  }

  @Post('/add-food-to-cart')
  @ResponseMessage('Thêm món ăn vào giỏ hàng thành công')
  async addFoodToCart(@Query('food_id') food_id: string, @Request() req: RequestExpress): Promise<boolean> {
    return await this.foodRestaurantService.addFoodToCart({ food_id, id_user_guest: req.headers['x-cl-id'] as string })
  }

  @Delete('/remove-food-cart')
  @ResponseMessage('Xóa món ăn trong giỏ hàng thành công')
  async removeFoodCart(@Query('food_id') food_id: string, @Request() req: RequestExpress): Promise<boolean> {
    return await this.foodRestaurantService.deleteFoodCart({ food_id, id_user_guest: req.headers['x-cl-id'] as string })
  }

  @Get('/list-food/:food_res_id')
  @ResponseMessage('Lấy danh sách món ăn thành công')
  async findFoodRestaurants(@Param('food_res_id') food_res_id: string): Promise<FoodRestaurantEntity[]> {
    return await this.foodRestaurantService.findFoodRestaurants(food_res_id)
  }

  @Get('/food-name')
  @ResponseMessage('Lấy danh sách tên món ăn thành công')
  @UseGuards(AccountAuthGuard)
  async findFoodName(@Acccount() account: IAccount): Promise<FoodRestaurantEntity[]> {
    return await this.foodRestaurantService.findFoodName(account)
  }

  @Get('recycle')
  @ResponseMessage('Lấy danh sách món ăn đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('food_name') food_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity>> {
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
