import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateInforUserDto, } from './create-infor-user.dto'

export class UpdateInforUserDto extends PartialType(CreateInforUserDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  ifuser_id: string
}
