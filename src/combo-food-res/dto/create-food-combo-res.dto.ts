import { Type } from 'class-transformer'
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from 'class-validator'

export class CreateFoodComboResDto {
  @IsNotEmpty({ message: 'Tên combo không được để trống' })
  @IsString({ message: 'Tên combo phải là chuỗi' })
  fcb_name: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  fcb_description: string

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber({}, { message: 'Giá phải là số' })
  fcb_price: number

  @IsNotEmpty({ message: 'Hình ảnh không được để trống' })
  @IsString({ message: 'Hình ảnh phải là chuỗi' })
  fcb_image: string

  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  fcb_note: string

  @IsNotEmpty({ message: 'Thứ tự không được để trống' })
  @IsNumber({}, { message: 'Thứ tự phải là số' })
  fcb_sort: number

  @IsNotEmpty({ message: 'Thời gian mở bán không được để trống' })
  @IsString({ message: 'Thời gian mở bán phải là chuỗi' })
  fcb_open_time: string

  @IsNotEmpty({ message: 'Thời gian đóng cửa không được để trống' })
  @IsString({ message: 'Thời gian đóng cửa phải là chuỗi' })
  fcb_close_time: string

  @IsArray({ message: 'Danh sách món ăn phải là một mảng' })
  @ArrayNotEmpty({ message: 'Danh sách món ăn không được để trống' })
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  food_items: FoodItemDto[]
}

export class FoodItemDto {
  @IsNotEmpty({ message: 'ID món ăn không được để trống' })
  @IsUUID('4', { message: 'ID món ăn phải là một UUID hợp lệ' })
  food_id: string

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsNumber({}, { message: 'Số lượng phải là một số' })
  food_quantity: number
}
