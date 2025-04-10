import { Type } from "class-transformer";
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateOrderFoodDto {
  @IsNotEmpty({ message: 'Nhà hàng không được để trống' })
  @IsString({ message: 'Nhà hàng không hợp lệ' })
  od_res_id: string;

  @IsOptional()
  @IsNumber({}, { message: 'Id người dùng không hợp lệ' })
  od_user_id?: number;

  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString({ message: 'Tên người nhận không hợp lệ' })
  od_user_name: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  od_user_phone: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email không hợp lệ' })
  od_user_email: string;

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ không hợp lệ' })
  od_user_address: string;

  @IsNotEmpty({ message: 'Tỉnh không được để trống' })
  @IsString({ message: 'Tỉnh không hợp lệ' })
  od_user_province: string;

  @IsNotEmpty({ message: 'Quận không được để trống' })
  @IsString({ message: 'Quận không hợp lệ' })
  od_user_district: string;

  @IsNotEmpty({ message: 'Phường không được để trống' })
  @IsString({ message: 'Phường không hợp lệ' })
  od_user_ward: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú không hợp lệ' })
  od_user_note?: string;

  //od_type_shipping: 'GHN' | 'GHTK'
  @IsNotEmpty({ message: 'Phương thức giao hàng không được để trống' })
  @IsIn(['GHN', 'GHTK'], { message: 'Phương thức giao hàng phải là "GHN", "GHTK"' })
  od_type_shipping: 'GHN' | 'GHTK'

  //od_price_shipping
  @IsNotEmpty({ message: 'Giá giao hàng không được để trống' })
  @IsNumber({}, { message: 'Giá giao hàng không hợp lệ' })
  od_price_shipping: number;

  @IsNotEmpty({ message: 'Link xác nhận không được để trống' })
  @IsString({ message: 'Link xác nhận không hợp lệ' })
  od_link_confirm: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách món ăn không hợp lệ' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderFoodItemDto)
  order_food_items?: CreateOrderFoodItemDto[];

}

export class CreateOrderFoodItemDto {
  @IsNotEmpty({ message: 'Món ăn không được để trống' })
  @IsString({ message: 'Món ăn không hợp lệ' })
  food_id: string;

  @IsOptional()
  @IsArray({ message: 'Tùy chọn không hợp lệ' })
  food_options?: string[];

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng không hợp lệ' })
  od_it_quantity: number;
}