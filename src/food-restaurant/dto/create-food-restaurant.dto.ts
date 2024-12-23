import { IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'

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
}
