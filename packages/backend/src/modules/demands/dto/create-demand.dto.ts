import { IsString, IsNumber, IsOptional, IsIn, IsDateString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoPoint, NotifyChannel } from '@kosmes/shared';

class GeoPointDto implements GeoPoint {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
}

export class CreateDemandDto {
  @ApiProperty({ example: '소형 에어샤워 220V 1~2인용 원합니다' })
  @IsString()
  queryText: string;

  @ApiProperty({ type: GeoPointDto })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPoint;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({ enum: ['push', 'kakao', 'email'] })
  @IsOptional()
  @IsIn(['push', 'kakao', 'email'])
  notifyChannel?: NotifyChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
