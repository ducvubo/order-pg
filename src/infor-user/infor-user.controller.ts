import { InforUserService } from './infor-user.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { DeleteResult, UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { CreateInforUserDto } from './dto/create-infor-user.dto';
import { InforUserEntity } from './entities/infor-user.entity';
import { Request as RequestExpress } from 'express'
import { UpdateInforUserDto } from './dto/update-infor-user.dto';


@Controller('infor-user')
export class InforUserController {
  constructor(private readonly inforUserService: InforUserService) { }

  @Post()
  @ResponseMessage('Thêm danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async createInforUser(
    @Body() createInforUserDto: CreateInforUserDto,
    @Request() req: RequestExpress
  ): Promise<InforUserEntity> {
    return this.inforUserService.createInforUser(createInforUserDto, req.headers['x-cl-id'] as string)
  }

  @Patch()
  @ResponseMessage('Cập nhật danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateInforUser(
    @Body() updateInforUserDto: UpdateInforUserDto,
    @Request() req: RequestExpress
  ): Promise<UpdateResult> {
    return this.inforUserService.updateInforUser(updateInforUserDto, req.headers['x-cl-id'] as string)
  }

  @Get('find-all')
  @ResponseMessage('Lấy danh sách tên danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(@Request() req: RequestExpress): Promise<InforUserEntity[]> {
    return await this.inforUserService.findAll(req.headers['x-cl-id'] as string)
  }

  @Delete(':ifuser_id')
  @ResponseMessage('Xóa danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteInforUser(
    @Param('ifuser_id') ifuser_id: string,
    @Request() req: RequestExpress
  ): Promise<DeleteResult> {
    return this.inforUserService.deleteInforUser(ifuser_id, req.headers['x-cl-id'] as string)
  }

  @Get(':ifuser_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin danh mục menu thành công')
  async findOneById(
    @Param('ifuser_id') ifuser_id: string,
    @Request() req: RequestExpress
  ): Promise<InforUserEntity> {
    return this.inforUserService.findOneById(ifuser_id, req.headers['x-cl-id'] as string)
  }
}
