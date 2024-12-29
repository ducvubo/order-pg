import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator'

export class CreateFoodRestaurantDto {
  @IsNotEmpty({ message: 'Id danh mục không được để trống' })
  @IsString({ message: 'Id phải là chuỗi string' })
  @MinLength(24, { message: 'Id danh mục không hợp lệ' })
  @MaxLength(24, { message: 'Id danh mục không hợp lệ' })
  food_cat_id: string

  @IsNotEmpty({ message: 'Tên món ăn không được để trống' })
  @IsString({ message: 'Tên món ăn phải là chuỗi' })
  food_name: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  food_description: string

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @Min(0, { message: 'Giá không hợp lệ' })
  food_price: number

  @IsOptional()
  @IsString({ message: 'Ảnh phải là chuỗi' })
  food_image: string

  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  food_note: string

  @IsNotEmpty({ message: 'Thứ tự không được để trống' })
  @Min(0, { message: 'Thứ tự không hợp lệ' })
  food_sort: number

  @IsNotEmpty({ message: 'Thời gian mở bán không được để trống' })
  @IsString({ message: 'Thời gian mở bán phải là chuỗi' })
  food_open_time: string

  @IsNotEmpty({ message: 'Thời gian đóng cửa không được để trống' })
  @IsString({ message: 'Thời gian đóng cửa phải là chuỗi' })
  food_close_time: string

  @IsArray({ message: 'Danh sách lựa chọn phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => FoodOptions)
  food_options: FoodOptions[]
}

export class FoodOptions {
  @IsNotEmpty({ message: 'Tên lựa chọn không được để trống' })
  @IsString({ message: 'Tên lựa chọn phải là chuỗi' })
  fopt_name: string

  @IsNotEmpty({ message: 'Giá lựa chọn không được để trống' })
  @IsNumber({}, { message: 'Giá lựa chọn phải là số' })
  fopt_price: number

  //attribute
  @IsNotEmpty({ message: 'Thuộc tính không được để trống' })
  @IsString({ message: 'Thuộc tính phải là chuỗi' })
  fopt_attribute: string

  @IsNotEmpty({ message: 'Ảnh lựa không được để trống' })
  @IsString({ message: 'Ảnh lựa chọn phải là chuỗi' })
  fopt_image: string

  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['enable', 'disable'], { message: 'Trạng thái phải là "enable", "disable"' })
  fopt_status: 'enable' | 'disable'

  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['soldOut', 'inStock', 'almostOut'], { message: 'State phải là "soldOut", "inStock", almostOut"' })
  fopt_state: 'soldOut' | 'inStock' | 'almostOut'

  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  fopt_note: string
}
