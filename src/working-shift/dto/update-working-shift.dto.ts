import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateWorkingShiftDto } from './create-working-shit.dto'

export class UpdateWorkingShiftDto extends PartialType(CreateWorkingShiftDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  wks_id: string
}
