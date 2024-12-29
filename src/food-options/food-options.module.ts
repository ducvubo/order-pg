import { Module } from '@nestjs/common'
import { FoodOptionsService } from './food-options.service'
import { FoodOptionsController } from './food-options.controller'
import { FoodOptionsRepo } from './entities/food-options.repo'
import { FoodOptionsQuery } from './entities/food-options.query'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodOptionsEntity } from './entities/food-options.entity'

@Module({
  imports: [TypeOrmModule.forFeature([FoodOptionsEntity])],
  controllers: [FoodOptionsController],
  providers: [FoodOptionsService, FoodOptionsQuery, FoodOptionsRepo],
  exports: [FoodOptionsService, FoodOptionsQuery, FoodOptionsRepo]
})
export class FoodOptionsModule {}
