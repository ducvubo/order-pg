import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FoodRestaurantModule } from './food-restaurant/food-restaurant.module'
import { FoodRestaurantEntity, FoodRestaurantSubscriber } from './food-restaurant/entity/food-restaurant.entity'
import { KafkaModule } from './kafka/kafka.module'
import { WorkingShiftModule } from './working-shift/working-shift.module'
import { WorkingShiftEntity, WorkingShiftSubscriber } from './working-shift/entity/working-shift.entity'
import { ShiftAssignmentsModule } from './shift-assignments/shift-assignments.module'
import { ShiftAssignmentEntity, ShiftAssignmentSubscriber } from './shift-assignments/entity/shift-assignments.entity'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'mysql-39588c9a-vminhduc8-88ed.a.aivencloud.com',
      port: 13890,
      username: 'avnadmin',
      password: 'AVNS_nejNZ1u-tCiAtEqOUdh',
      database: 'OrderPG',
      entities: [FoodRestaurantEntity, WorkingShiftEntity, ShiftAssignmentEntity],
      subscribers: [FoodRestaurantSubscriber, WorkingShiftSubscriber, ShiftAssignmentSubscriber],
      synchronize: true
    }),
    FoodRestaurantModule,
    KafkaModule,
    WorkingShiftModule,
    ShiftAssignmentsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
