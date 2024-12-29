import { Module } from '@nestjs/common';
import { ProgramPromotionService } from './program-promotion.service';
import { ProgramPromotionController } from './program-promotion.controller';

@Module({
  controllers: [ProgramPromotionController],
  providers: [ProgramPromotionService],
})
export class ProgramPromotionModule {}
