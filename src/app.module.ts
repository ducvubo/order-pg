import 'reflect-metadata'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
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
import { UploadModule } from './upload/upload.module'
import { SpecialOffersModule } from './special-offers/special-offers.module'
import { SpecialOfferEntity, SpecialOfferSubscriber } from './special-offers/entities/special-offer.entity'
import { RateLimiterMiddleware } from './middleware/rate-limiter.middleware'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     {
    //       ttl: 60000,
    //       limit: 10000
    //     }
    //   ]
    // }),
    TypeOrmModule.forRoot({
      type: 'oracle',
      host: '160.191.51.57',
      port: 1521,
      username: 'OrderPG',
      password: 'Duc17052003*',
      serviceName: 'ORCLPDB1',
      entities: [
        FoodRestaurantEntity,
        FoodComboItemsEntity,
        FoodComboResEntity,
        FoodOptionsEntity,
        SpecialOfferEntity,
      ],
      subscribers: [
        FoodRestaurantSubscriber,
        FoodComboResSubscriber,
        FoodComboItemsSubscriber,
        FoodOptionsSubscriber,
        SpecialOfferSubscriber,
      ],
      synchronize: true
    }),
    FoodRestaurantModule,
    ComboFoodResModule,
    FoodComboItemsModule,
    FoodOptionsModule,
    UploadModule,
    SpecialOffersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

  ]
})
// export class AppModule {}
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*') // Áp dụng cho tất cả route
  }
}
