import { Module } from '@nestjs/common';
import { OrderFoodComboService } from './order-food-combo.service';
import { OrderFoodComboController } from './order-food-combo.controller';

@Module({
  controllers: [OrderFoodComboController],
  providers: [OrderFoodComboService],
})
export class OrderFoodComboModule {}
