import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateFoodComboResDto } from './create-food-combo-res.dto'

export class UpdateFoodComboResDto extends PartialType(CreateFoodComboResDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  fcb_id: string
}
