import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodRestaurantModule } from './food-restaurant/food-restaurant.module'
import { FoodRestaurantEntity, FoodRestaurantSubscriber } from './food-restaurant/entities/food-restaurant.entity'
import { ComboFoodResModule } from './combo-food-res/combo-food-res.module'
import { FoodComboItemsModule } from './food-combo-items/food-combo-items.module'
import { FoodComboItemsEntity, FoodComboItemsSubscriber } from './food-combo-items/entities/food-combo-items.entity'
import { FoodComboResEntity, FoodComboResSubscriber } from './combo-food-res/entities/combo-food-res.entity'
import { FoodOptionsModule } from './food-options/food-options.module'
import { FoodOptionsEntity, FoodOptionsSubscriber } from './food-options/entities/food-options.entity'
import { ProgramPromotionModule } from './program-promotion/program-promotion.module'
import * as fs from 'fs'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '223.130.11.174',
      port: 5432,
      username: 'myuser',
      password: 'mypassword',
      database: 'orderpg',
      ssl: {
        rejectUnauthorized: true,
        ca: Buffer.from(fs.readFileSync('src/config/keypem/ca-pg.pem'))
      },
      entities: [FoodRestaurantEntity, FoodComboItemsEntity, FoodComboResEntity, FoodOptionsEntity],
      subscribers: [FoodRestaurantSubscriber, FoodComboResSubscriber, FoodComboItemsSubscriber, FoodOptionsSubscriber],
      synchronize: true
    }),
    FoodRestaurantModule,
    ComboFoodResModule,
    FoodComboItemsModule,
    FoodOptionsModule,
    ProgramPromotionModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
