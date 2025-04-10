import { IsNotEmpty, IsString } from 'class-validator'

export class CreateInforUserDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  ifuser_name: string

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  ifuser_phone?: string

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi' })
  ifuser_email?: string

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  ifuser_address?: string

  @IsNotEmpty({ message: 'Tỉnh không được để trống' })
  @IsString({ message: 'Tỉnh phải là chuỗi' })
  ifuser_province_id?: string

  @IsNotEmpty({ message: 'Quận huyện không được để trống' })
  @IsString({ message: 'Quận huyện phải là chuỗi' })
  ifuser_district_id?: string

  @IsNotEmpty({ message: 'Phường xã không được để trống' })
  @IsString({ message: 'Phường xã phải là chuỗi' })
  ifuser_ward_id: string

  @IsNotEmpty({ message: 'Tỉnh không được để trống' })
  @IsString({ message: 'Tỉnh phải là chuỗi' })
  ifuser_province_name?: string

  @IsNotEmpty({ message: 'Quận huyện không được để trống' })
  @IsString({ message: 'Quận huyện phải là chuỗi' })
  ifuser_district_name?: string

  @IsNotEmpty({ message: 'Phường xã không được để trống' })
  @IsString({ message: 'Phường xã phải là chuỗi' })
  ifuser_ward_name?: string

  @IsNotEmpty({ message: 'Kinh độ không được để trống' })
  @IsString({ message: 'Kinh độ phải là chuỗi' })
  ifuser_longitude?: string

  @IsNotEmpty({ message: 'Vĩ độ không được để trống' })
  @IsString({ message: 'Vĩ độ phải là chuỗi' })
  ifuser_latitude?: string
}
