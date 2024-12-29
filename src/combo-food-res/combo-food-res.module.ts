import { Module } from '@nestjs/common'
import { ComboFoodResService } from './combo-food-res.service'
import { ComboFoodResController } from './combo-food-res.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodComboResEntity } from './entities/combo-food-res.entity'
import { FoodComboResQuery } from './entities/food-combo-res.query'
import { FoodComboResRepo } from './entities/food-combo-res.repo'
import { FoodComboItemsModule } from 'src/food-combo-items/food-combo-items.module'
import { FoodRestaurantModule } from 'src/food-restaurant/food-restaurant.module'

@Module({
  imports: [TypeOrmModule.forFeature([FoodComboResEntity]), FoodComboItemsModule, FoodRestaurantModule],
  controllers: [ComboFoodResController],
  providers: [ComboFoodResService, FoodComboResQuery, FoodComboResRepo]
})
export class ComboFoodResModule {}
