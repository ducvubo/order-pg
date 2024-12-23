import { Module } from '@nestjs/common'
import { FoodRestaurantService } from './food-restaurant.service'
import { FoodRestaurantController } from './food-restaurant.controller'
import { FoodRestaurantRepo } from './entity/food-restaurant.repo'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodRestaurantEntity } from './entity/food-restaurant.entity'

@Module({
  imports: [TypeOrmModule.forFeature([FoodRestaurantEntity])],
  controllers: [FoodRestaurantController],
  providers: [FoodRestaurantService, FoodRestaurantRepo]
})
export class FoodRestaurantModule {}
