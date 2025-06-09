import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards, } from '@nestjs/common';
import { OrderFoodComboService } from './order-food-combo.service';
import { Acccount, ResponseMessage } from 'src/decorator/customize';
import { CreateOrderFoodComboDto } from './dto/create-order-food-combo.dto';
import { Request as RequestExpress } from 'express'
import { OrderFoodComboEntity } from './entities/order-food-combo.entity';
import { AccountAuthGuard } from 'src/guard/account.guard';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';
import { GetStatsDto } from 'src/order-food/dto/get-stats.dto';

@Controller('order-food-combo')
export class OrderFoodComboController {
  constructor(private readonly orderFoodComboService: OrderFoodComboService) { }

  @Post('create-order-food-combo')
  @ResponseMessage('Tạo đơn hàng thành công')
  async createOrderFoodCombo(
    @Body() createOrderFoodComboDto: CreateOrderFoodComboDto,
    @Request() req: RequestExpress
  ): Promise<OrderFoodComboEntity> {
    return this.orderFoodComboService.createOrderFoodCombo(createOrderFoodComboDto, req.headers['x-cl-id'] as string);
  }

  @Patch('/guest-confirm-order-food-combo')
  @ResponseMessage('Khách hàng đã xác nhận đơn hàng thành công')
  async guestConfirmOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestConfirmOrderFoodCombo(od_cb_id, od_cb_res_id);
  }

  @Patch('/guest-cancel-order-food-combo')
  @ResponseMessage('Khách hàng đã hủy đơn hàng thành công')
  async guestCancelOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string, @Body('od_cb_reason_cancel') od_cb_reason_cancel, @Request() req: RequestExpress): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestCancelOrderFoodCombo(od_cb_id, od_cb_res_id, od_cb_reason_cancel, req.headers['x-cl-id'] as string);
  }

  @Patch('/restaurant-confirm-order-food-combo')
  @ResponseMessage('Nhà hàng đã xác nhận đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantConfirmOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantConfirmOrderFoodCombo(od_cb_id, account);
  }

  @Patch('/restaurant-confirm-shipping-order-food-combo')
  @ResponseMessage('Nhà hàng đã xác nhận đang giao hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantConfirmShippingOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantConfirmShippingOrderFoodCombo(od_cb_id, account);
  }

  @Patch('/restaurant-delivered-order-food-combo')
  @ResponseMessage('Nhà hàng đã giao hàng đến khách hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantDeliveredOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantDeliveredOrderFoodCombo(od_cb_id, account);
  }

  //restaurantCustomerUnreachableOrderFoodCombo
  @Patch('/restaurant-customer-unreachable-order-food-combo')
  @ResponseMessage('Nhà hàng đã không liên lạc được với khách hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantCustomerUnreachableOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantCustomerUnreachableOrderFoodCombo(od_cb_id, account);
  }

  @Patch('/restaurant-cancel-order-food-combo')
  @ResponseMessage('Nhà hàng đã hủy đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantCancelOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_reason_cancel') od_cb_reason_cancel, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantCancelOrderFoodCombo(od_cb_id, od_cb_reason_cancel, account);
  }

  @Patch('/guest-receive-order-food-combo')
  @ResponseMessage('Khách hàng đã nhận đơn hàng thành công')
  async guestReceiveOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestReceivedOrderFoodCombo(od_cb_id, od_cb_res_id, req.headers['x-cl-id'] as string);
  }

  @Patch('/guest-complaint-order-food-combo')
  @ResponseMessage('Khách hàng đã khiếu nại đơn hàng thành công')
  async guestComplaintOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string, @Request() req: RequestExpress,
    @Body('complaint') complaint: string): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestComplaintOrderFoodCombo(od_cb_id, od_cb_res_id, req.headers['x-cl-id'] as string, complaint);
  }

  @Patch('/guest-complaint-done-order-food-combo')
  @ResponseMessage('Khách hàng đã khiếu nại đơn hàng thành công')
  async guestComplaintDoneOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string, @Request() req: RequestExpress): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestComplaintDoneOrderFoodCombo(od_cb_id, od_cb_res_id, req.headers['x-cl-id'] as string);
  }


  @Patch('/guest-feedback-order-food-combo')
  @ResponseMessage('Khách hàng đã phản hồi đơn hàng thành công')
  async guestFeedbackOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_res_id') od_cb_res_id: string, @Request() req: RequestExpress,
    @Body('od_cb_feed_star') od_cb_feed_star: 1 | 2 | 3 | 4 | 5, @Body('od_cb_feed_content') od_cb_feed_content: string): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.guestFeedbackOrderFoodCombo(od_cb_id, od_cb_res_id, req.headers['x-cl-id'] as string, od_cb_feed_star, od_cb_feed_content);
  }

  @Patch('/restaurant-feedback-order-food-combo')
  @ResponseMessage('Nhà hàng đã phản hồi đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantFeedbackOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_feed_reply') od_cb_feed_reply: string, @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantFeedbackOrderFoodCombo(od_cb_id, od_cb_feed_reply, account);
  }

  //async restaurantUpdateViewFeedbackOrderFoodCombo(od_cb_id: string, od_cb_feed_view: 'active' | 'disable', account: IAccount):
  @Patch('/restaurant-update-view-feedback-order-food-combo')
  @ResponseMessage('Nhà hàng đã cập nhật trạng thái phản hồi đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async restaurantUpdateViewFeedbackOrderFoodCombo(@Body('od_cb_id') od_cb_id: string, @Body('od_cb_feed_view') od_cb_feed_view: 'active' | 'disable', @Acccount() account: IAccount): Promise<OrderFoodComboEntity> {
    return await this.orderFoodComboService.restaurantUpdateViewFeedbackOrderFoodCombo(od_cb_id, od_cb_feed_view, account);
  }

  @Get('/get-list-order-food-combo-restaurant-pagination')
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  @UseGuards(AccountAuthGuard)
  async getListOrderFoodRestaurantPagination(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('q') keyword: string,
    @Query('od_cb_status') od_cb_status: 'waiting_confirm_customer' | 'over_time_customer' | 'waiting_confirm_restaurant' | 'waiting_shipping' | 'shipping' | 'delivered_customer' | 'received_customer' | 'cancel_customer' | 'cancel_restaurant' | 'complaint' | 'complaint_done' | 'all',
    @Query('toDate') toDate: string,
    @Query('fromDate') fromDate: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<OrderFoodComboEntity>> {
    return await this.orderFoodComboService.getListOrderFoodComboRestaurantPagination({ pageSize: +pageSize, pageIndex: +pageIndex, keyword, od_cb_status, toDate, fromDate }, account);
  }

  @Get('/get-list-order-food-combo-guest-pagination')
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  async getListOrderFoodGuestPagination(
    @Query('pageIndex') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('q') keyword: string,
    @Query('od_cb_status') od_cb_status: 'waiting_confirm_customer' | 'over_time_customer' | 'waiting_confirm_restaurant' | 'waiting_shipping' | 'shipping' | 'delivered_customer' | 'received_customer' | 'cancel_customer' | 'cancel_restaurant' | 'complaint' | 'complaint_done' | 'all',
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
    result: OrderFoodComboEntity[]
  }> {
    return await this.orderFoodComboService.getListOrderFoodComboGuestPagination({ pageSize: +pageSize, pageIndex: +pageIndex, keyword, od_cb_status, toDate, fromDate, id_user_guest: req.headers['x-cl-id'] as string });
  }

  @Get('/get-list-feedback-order-food-combo/:restaurant_id')
  @ResponseMessage('Lấy danh sách đánh giá thành công')
  async getListFeedbackOrderFoodCombo(
    @Query('pageIndex') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('star') star: string,
    @Param('restaurant_id') restaurant_id: string
  ): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: OrderFoodComboEntity[]
  }> {
    return await this.orderFoodComboService.getListFeedbackOrderFoodCombo({ pageIndex: +pageIndex, pageSize: +pageSize, star, restaurant_id });
  }

  @Get('total-revenue')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy tổng doanh thu thành công')
  async getTotalComboRevenue(@Query() dto: GetStatsDto, @Acccount() account: IAccount) {
    return this.orderFoodComboService.getTotalComboRevenue(dto, account);
  }

  @Get('revenue-trends')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy tổng doanh thu thành công')
  async getComboRevenueTrends(@Query() dto: GetStatsDto, @Acccount() account: IAccount) {
    return this.orderFoodComboService.getComboRevenueTrends(dto, account);
  }

  @Get('top-combos')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy tổng doanh thu thành công')
  async getTopCombos(@Query() dto: GetStatsDto, @Acccount() account: IAccount) {
    return this.orderFoodComboService.getTopCombos(dto, account);
  }

  @Get('recent-orders')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy tổng doanh thu thành công')
  async getRecentComboOrders(@Query() dto: GetStatsDto, @Acccount() account: IAccount) {
    return this.orderFoodComboService.getRecentComboOrders(dto, account);
  }

  @Get('status-distribution')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy tổng doanh thu thành công')
  async getOrderStatusDistribution(@Query() dto: GetStatsDto, @Acccount() account: IAccount) {
    return this.orderFoodComboService.getOrderStatusDistribution(dto, account);
  }
}
