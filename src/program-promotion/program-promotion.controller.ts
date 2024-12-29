import { Controller } from '@nestjs/common';
import { ProgramPromotionService } from './program-promotion.service';

@Controller('program-promotion')
export class ProgramPromotionController {
  constructor(private readonly programPromotionService: ProgramPromotionService) {}
}
