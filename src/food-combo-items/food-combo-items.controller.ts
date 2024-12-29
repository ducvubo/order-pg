import { Controller } from '@nestjs/common'
import { FoodComboItemsService } from './food-combo-items.service'

@Controller('food-combo-items')
export class FoodComboItemsController {
  constructor(private readonly foodComboItemsService: FoodComboItemsService) {}
}
