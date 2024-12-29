import { Injectable } from '@nestjs/common'
import { FoodComboItemsQuery } from './entities/food-combo-items.query'
import { FoodComboItemsRepo } from './entities/food-combo-items.repo'

@Injectable()
export class FoodComboItemsService {
  constructor(
    private readonly foodComboItemsQuery: FoodComboItemsQuery,
    private readonly foodComboItemsRepo: FoodComboItemsRepo
  ) {}
}
