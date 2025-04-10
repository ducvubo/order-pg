import { Body, Controller, Get, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { OrderFoodService } from './order-food.service';
import { Acccount, ResponseMessage } from 'src/decorator/customize';
import { CreateOrderFoodDto } from './dto/create-order-food.dto';
import { Request as RequestExpress } from 'express'
import { OrderFoodEntity } from './entities/order-food.entity';
import { AccountAuthGuard } from 'src/guard/account.guard';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';

@Controller('order-food')
export class OrderFoodController {
  constructor(private readonly orderFoodService: OrderFoodService) { }

  @Post('/create-order-food')
  @ResponseMessage('Tạo đơn hàng thành công')
  async createOrderFood(@Body() createOrderFoodDto: CreateOrderFoodDto, @Request() req: RequestExpress): Promise<OrderFoodEntity> {
    return await this.orderFoodService.createOrderFood(createOrderFoodDto, req.headers['x-cl-id'] as string);
  }

  @Patch('/guest-confirm-order-food')
  @ResponseMessage('Khách hàng đã xác nhận đơn hàng thành công')
  async guestConfirmOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestConfirmOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string);
  }

  @Patch('/guest-cancel-order-food')
  @ResponseMessage('Khách hàng đã hủy đơn hàng thành công')
  async guestCancelOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestCancelOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string);
  }

  @Patch('/restaurant-confirm-order-food')
  @ResponseMessage('Nhà hàng đã xác nhận đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantConfirmOrderFood(@Body('od_id') od_id: string, @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantConfirmOrderFood(od_id, account);
  }

  @Patch('/restaurant-confirm-shipping-order-food')
  @ResponseMessage('Nhà hàng đã xác nhận đang giao hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantConfirmShippingOrderFood(@Body('od_id') od_id: string, @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantConfirmShippingOrderFood(od_id, account);
  }

  @Patch('/restaurant-delivered-order-food')
  @ResponseMessage('Nhà hàng đã giao hàng đến khách hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantDeliveredOrderFood(@Body('od_id') od_id: string, @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantDeliveredOrderFood(od_id, account);
  }

  @Patch('/restaurant-cancel-order-food')
  @ResponseMessage('Nhà hàng đã hủy đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantCancelOrderFood(@Body('od_id') od_id: string, @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantCancelOrderFood(od_id, account);
  }

  @Patch('/guest-receive-order-food')
  @ResponseMessage('Khách hàng đã nhận đơn hàng thành công')
  async guestReceiveOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestReceivedOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string);
  }

  @Patch('/guest-complaint-order-food')
  @ResponseMessage('Khách hàng đã khiếu nại đơn hàng thành công')
  async guestComplaintOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress,
    @Body('complaint') complaint: string): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestComplaintOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string, complaint);
  }

  @Patch('/guest-complaint-done-order-food')
  @ResponseMessage('Khách hàng đã khiếu nại đơn hàng thành công')
  async guestComplaintDoneOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestComplaintDoneOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string);
  }


  @Patch('/guest-feedback-order-food')
  @ResponseMessage('Khách hàng đã phản hồi đơn hàng thành công')
  async guestFeedbackOrderFood(@Body('od_id') od_id: string, @Body('od_res_id') od_res_id: string, @Request() req: RequestExpress,
    @Body('od_feed_star') od_feed_star: 1 | 2 | 3 | 4 | 5, @Body('od_feed_content') od_feed_content: string): Promise<OrderFoodEntity> {
    return await this.orderFoodService.guestFeedbackOrderFood(od_id, od_res_id, req.headers['x-cl-id'] as string, od_feed_star, od_feed_content);
  }

  @Patch('/restaurant-feedback-order-food')
  @ResponseMessage('Nhà hàng đã phản hồi đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantFeedbackOrderFood(@Body('od_id') od_id: string, @Body('od_feed_reply') od_feed_reply: string, @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantFeedbackOrderFood(od_id, od_feed_reply, account);
  }

  //async restaurantUpdateViewFeedbackOrderFood(od_id: string, od_feed_view: 'active' | 'disable', account: IAccount):
  @Patch('/restaurant-update-view-feedback-order-food')
  @ResponseMessage('Nhà hàng đã cập nhật trạng thái phản hồi đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantUpdateViewFeedbackOrderFood(@Body('od_id') od_id: string, @Body('od_feed_view') od_feed_view: 'active' | 'disable', @Acccount() account: IAccount): Promise<OrderFoodEntity> {
    return await this.orderFoodService.restaurantUpdateViewFeedbackOrderFood(od_id, od_feed_view, account);
  }

  @Get('/get-list-order-food-restaurant-pagination')
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async getListOrderFoodRestaurantPagination(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('q') keyword: string,
    @Query('od_status') od_status: 'waiting_confirm_customer' | 'over_time_customer' | 'waiting_confirm_restaurant' | 'waiting_shipping' | 'shipping' | 'delivered_customer' | 'received_customer' | 'cancel_customer' | 'cancel_restaurant' | 'complaint' | 'complaint_done' | 'all',
    @Query('toDate') toDate: string,
    @Query('fromDate') fromDate: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<OrderFoodEntity>> {
    return await this.orderFoodService.getListOrderFoodRestaurantPagination({ pageSize: +pageSize, pageIndex: +pageIndex, keyword, od_status, toDate, fromDate }, account);
  }

  @Get('/get-list-order-food-guest-pagination')
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  async getListOrderFoodGuestPagination(
    @Query('pageIndex') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('q') keyword: string,
    @Query('od_status') od_status: 'waiting_confirm_customer' | 'over_time_customer' | 'waiting_confirm_restaurant' | 'waiting_shipping' | 'shipping' | 'delivered_customer' | 'received_customer' | 'cancel_customer' | 'cancel_restaurant' | 'complaint' | 'complaint_done' | 'all',
    @Query('toDate') toDate: string,
    @Query('fromDate') fromDate: string,
    @Request() req: RequestExpress
  ): Promise<{
    meta: {
      pageIndex: number;
      pageSize: number;
      totalItem: number;
      totalPage: number;
    };
    result: OrderFoodEntity[]
  }> {
    return await this.orderFoodService.getListOrderFoodGuestPagination({ pageSize: +pageSize, pageIndex: +pageIndex, keyword, od_status, toDate, fromDate, id_user_guest: req.headers['x-cl-id'] as string });
  }

  @Get('/get-order-food-detail')
  @ResponseMessage('Lấy chi tiết đơn hàng thành công')
  async getOrderFoodByIdByGuest(
    @Query('od_id') od_id: string,
    @Query('od_res_id') od_res_id: string,
    @Request() req: RequestExpress
  ): Promise<OrderFoodEntity> {
    return await this.orderFoodService.getOrderFoodByIdByGuest(od_id, od_res_id, req.headers['x-cl-id'] as string);
  }

  @Get('/get-order-food-detail-restaurant')
  @ResponseMessage('Lấy chi tiết đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async getOrderFoodByIdByRestaurant(
    @Query('od_id') od_id: string,
    @Acccount() account: IAccount
  ): Promise<OrderFoodEntity> {
    return await this.orderFoodService.getOrderFoodById(od_id, account);
  }
}
