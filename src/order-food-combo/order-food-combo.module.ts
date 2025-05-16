import { Module } from '@nestjs/common';
import { OrderFoodComboService } from './order-food-combo.service';
import { OrderFoodComboController } from './order-food-combo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderFoodComboEntity } from './entities/order-food-combo.entity';
import { OrderFoodComboItemEntity } from './entities/order-food-combo-item.entity';
import { FoodComboSnapEntity } from './entities/food-combo-snap.entity';
import { OrderFoodComboRepo } from './entities/order-food-combo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OrderFoodComboEntity, OrderFoodComboItemEntity, FoodComboSnapEntity])],
  controllers: [OrderFoodComboController],
  providers: [OrderFoodComboService,OrderFoodComboRepo],
})
export class OrderFoodComboModule { }
