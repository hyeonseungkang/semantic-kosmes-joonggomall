import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandEntity } from '../../database/entities/demand.entity';
import { MatchEntity } from '../../database/entities/match.entity';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [TypeOrmModule.forFeature([DemandEntity, MatchEntity]), SearchModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
