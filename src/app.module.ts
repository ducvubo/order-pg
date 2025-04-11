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
import { InforUserModule } from './infor-user/infor-user.module';
import { OrderFoodModule } from './order-food/order-food.module';
import { OrderFoodEntity } from './order-food/entities/order-food.entity'
import { FoodSnapEntity } from './order-food/entities/food-snap.entity'
import { OrderFoodItemEntity } from './order-food/entities/order-food-item.entity'
import { CronModule } from './cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule'
import { OrderFoodComboModule } from './order-food-combo/order-food-combo.module';
import { OrderFoodComboEntity } from './order-food-combo/entities/order-food-combo.entity'
import { OrderFoodComboItemEntity } from './order-food-combo/entities/order-food-combo-item.entity'
import { FoodComboSnapEntity } from './order-food-combo/entities/food-combo-snap.entity'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
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
      host: '160.187.229.179',
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
        OrderFoodEntity, FoodSnapEntity, OrderFoodItemEntity,
        OrderFoodComboEntity, OrderFoodComboItemEntity, FoodComboSnapEntity
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
    InforUserModule,
    OrderFoodModule,
    CronModule,
    OrderFoodComboModule,
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
