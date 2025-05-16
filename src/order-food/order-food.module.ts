import { Module } from '@nestjs/common';
import { OrderFoodService } from './order-food.service';
import { OrderFoodController } from './order-food.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderFoodEntity } from './entities/order-food.entity';
import { FoodSnapEntity } from './entities/food-snap.entity';
import { OrderFoodItemEntity } from './entities/order-food-item.entity';
import { FoodRestaurantEntity } from 'src/food-restaurant/entities/food-restaurant.entity';
import { OrderFoodRepo } from './entities/order-food.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OrderFoodEntity, FoodSnapEntity, OrderFoodItemEntity, FoodRestaurantEntity])], // Add your entities here
  controllers: [OrderFoodController],
  providers: [OrderFoodService, OrderFoodRepo],
})
export class OrderFoodModule { }
