import { Controller } from '@nestjs/common';
import { OrderFoodComboService } from './order-food-combo.service';

@Controller('order-food-combo')
export class OrderFoodComboController {
  constructor(private readonly orderFoodComboService: OrderFoodComboService) {}
}
