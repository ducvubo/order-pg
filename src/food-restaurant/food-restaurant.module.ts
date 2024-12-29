import { Module } from '@nestjs/common'
import { FoodRestaurantService } from './food-restaurant.service'
import { FoodRestaurantController } from './food-restaurant.controller'
import { FoodRestaurantRepo } from './entities/food-restaurant.repo'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodRestaurantEntity } from './entities/food-restaurant.entity'
import { FoodRestaurantQuery } from './entities/food-restaurant.query'
import { FoodOptionsModule } from 'src/food-options/food-options.module'

@Module({
  imports: [TypeOrmModule.forFeature([FoodRestaurantEntity]), FoodOptionsModule],
  controllers: [FoodRestaurantController],
  providers: [FoodRestaurantService, FoodRestaurantRepo, FoodRestaurantQuery],
  exports: [FoodRestaurantService, FoodRestaurantRepo, FoodRestaurantQuery]
})
export class FoodRestaurantModule {}
