import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateSpecialOfferDto } from './create-special-offer.dto'

export class UpdateSpecialOfferDto extends PartialType(CreateSpecialOfferDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  spo_id: string
}
