import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateFoodRestaurantDto } from './create-food-restaurant.dto'

export class UpdateFoodRestaurantDto extends PartialType(CreateFoodRestaurantDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  food_id: string
}
