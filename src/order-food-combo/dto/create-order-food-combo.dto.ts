import { Type } from "class-transformer";
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateOrderFoodComboDto {
  @IsNotEmpty({ message: 'Nhà hàng không được để trống' })
  @IsString({ message: 'Nhà hàng không hợp lệ' })
  od_cb_res_id: string;

  @IsOptional()
  @IsNumber({}, { message: 'Id người dùng không hợp lệ' })
  od_cb_user_id?: number;

  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString({ message: 'Tên người nhận không hợp lệ' })
  od_cb_user_name: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  od_cb_user_phone: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email không hợp lệ' })
  od_cb_user_email: string;

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ không hợp lệ' })
  od_cb_user_address: string;

  @IsNotEmpty({ message: 'Tỉnh không được để trống' })
  @IsString({ message: 'Tỉnh không hợp lệ' })
  od_cb_user_province: string;

  @IsNotEmpty({ message: 'Quận không được để trống' })
  @IsString({ message: 'Quận không hợp lệ' })
  od_cb_user_district: string;

  @IsNotEmpty({ message: 'Phường không được để trống' })
  @IsString({ message: 'Phường không hợp lệ' })
  od_cb_user_ward: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú không hợp lệ' })
  od_cb_user_note?: string;

  @IsNotEmpty({ message: 'Phương thức giao hàng không được để trống' })
  @IsIn(['GHN', 'GHTK'], { message: 'Phương thức giao hàng phải là "GHN", "GHTK"' })
  od_cb_type_shipping: 'GHN' | 'GHTK'

  @IsNotEmpty({ message: 'Giá giao hàng không được để trống' })
  @IsNumber({}, { message: 'Giá giao hàng không hợp lệ' })
  od_cb_price_shipping: number;

  @IsNotEmpty({ message: 'Link xác nhận không được để trống' })
  @IsString({ message: 'Link xác nhận không hợp lệ' })
  od_cb_link_confirm: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách món ăn không hợp lệ' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderFoodComboItemDto)
  order_food_combo_items?: CreateOrderFoodComboItemDto[];
}

export class CreateOrderFoodComboItemDto {
  @IsNotEmpty({ message: 'Combo món ăn không được để trống' })
  @IsString({ message: 'Combo món ăn không hợp lệ' })
  fcb_id: string;

  @IsOptional()
  @IsArray({ message: 'Tùy chọn không hợp lệ' })
  fcbi_combo?: string[];

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng không hợp lệ' })
  od_cb_it_quantity: number;
}