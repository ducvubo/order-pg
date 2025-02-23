import { Module } from '@nestjs/common'
import { SpecialOffersService } from './special-offers.service'
import { SpecialOffersController } from './special-offers.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SpecialOfferEntity } from './entities/special-offer.entity'
import { SpecialOfferQuery } from './entities/special-offer.query'
import { SpecialOfferRepo } from './entities/special-offer.repo'

@Module({
  imports: [TypeOrmModule.forFeature([SpecialOfferEntity])],
  controllers: [SpecialOffersController],
  providers: [SpecialOffersService, SpecialOfferQuery, SpecialOfferRepo]
})
export class SpecialOffersModule {}
