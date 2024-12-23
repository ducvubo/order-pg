import { IsNotEmpty, IsString } from 'class-validator'

export class CreateWorkingShiftDto {
  @IsNotEmpty({ message: 'Tên ca làm không được để trống' })
  @IsString({ message: 'Tên ca làm phải là chuỗi' })
  wks_name: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  wks_description: string

  @IsNotEmpty({ message: 'Thời gian bắt đầu không được để trống' })
  @IsString({ message: 'Thời gian bắt đầu phải là chuỗi' })
  wks_start_time: string

  @IsNotEmpty({ message: 'Thời gian kết thúc không được để trống' })
  @IsString({ message: 'Thời gian kết thúc phải là chuỗi' })
  wks_end_time: string
}
