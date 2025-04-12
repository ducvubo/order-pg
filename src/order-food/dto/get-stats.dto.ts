// src/book-table/dto/get-stats.dto.ts
import { IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class GetStatsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}