import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListingQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryL1?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() voltage?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) offset?: number;
}
