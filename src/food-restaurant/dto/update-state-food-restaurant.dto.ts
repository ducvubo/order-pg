import { IsIn, IsNotEmpty, IsUUID } from 'class-validator'

export class UpdateStateFoodRestaurantDto {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một UUID hợp lệ' })
  food_id: string

  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['soldOut', 'inStock', 'almostOut'], { message: 'State phải là "soldOut", "inStock", almostOut"' })
  food_state: 'soldOut' | 'inStock' | 'almostOut'
}
