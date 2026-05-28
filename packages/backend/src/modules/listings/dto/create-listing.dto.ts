import { IsString, IsOptional, IsNumber, IsIn, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoPoint, Dimensions, PriceType, ListingCondition } from '@kosmes/shared';

class GeoPointDto implements GeoPoint {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
}

class DimensionsDto implements Dimensions {
  @IsNumber() l: number;
  @IsNumber() w: number;
  @IsNumber() h: number;
  @IsIn(['mm', 'cm', 'm']) unit: 'mm' | 'cm' | 'm';
}

export class CreateListingDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryL1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryL2?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional({ enum: ['fixed', 'negotiable', 'unknown'] })
  @IsOptional() @IsIn(['fixed', 'negotiable', 'unknown']) priceType?: PriceType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() voltage?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() powerKw?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weightKg?: number;
  @ApiPropertyOptional({ type: DimensionsDto })
  @IsOptional() @ValidateNested() @Type(() => DimensionsDto) dimensions?: Dimensions;
  @ApiPropertyOptional({ enum: ['new', 'used', 'refurbished'] })
  @IsOptional() @IsIn(['new', 'used', 'refurbished']) condition?: ListingCondition;
  @ApiPropertyOptional() @IsOptional() @IsString() locationText?: string;
  @ApiPropertyOptional({ type: GeoPointDto })
  @IsOptional() @ValidateNested() @Type(() => GeoPointDto) location?: GeoPoint;
}
