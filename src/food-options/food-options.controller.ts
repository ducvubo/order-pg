import { Controller } from '@nestjs/common';
import { FoodOptionsService } from './food-options.service';

@Controller('food-options')
export class FoodOptionsController {
  constructor(private readonly foodOptionsService: FoodOptionsService) {}
}
