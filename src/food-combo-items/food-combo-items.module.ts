import { Module } from '@nestjs/common'
import { FoodComboItemsService } from './food-combo-items.service'
import { FoodComboItemsController } from './food-combo-items.controller'
import { FoodComboItemsEntity } from './entities/food-combo-items.entity'
import { FoodComboItemsQuery } from './entities/food-combo-items.query'
import { FoodComboItemsRepo } from './entities/food-combo-items.repo'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [TypeOrmModule.forFeature([FoodComboItemsEntity])],
  controllers: [FoodComboItemsController],
  providers: [FoodComboItemsService, FoodComboItemsQuery, FoodComboItemsRepo],
  exports: [FoodComboItemsService, FoodComboItemsQuery, FoodComboItemsRepo]
})
export class FoodComboItemsModule {}
