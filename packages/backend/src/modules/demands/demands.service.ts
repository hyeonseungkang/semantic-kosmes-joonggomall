import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandEntity } from '../../database/entities/demand.entity';
import { MatchEntity } from '../../database/entities/match.entity';
import { SearchService } from '../search/search.service';
import { CreateDemandDto } from './dto/create-demand.dto';

@Injectable()
export class DemandsService {
  constructor(
    @InjectRepository(DemandEntity) private demandRepo: Repository<DemandEntity>,
    @InjectRepository(MatchEntity) private matchRepo: Repository<MatchEntity>,
    private searchService: SearchService,
  ) {}

  async create(dto: CreateDemandDto, buyerId: string) {
    // 1. Extract spec via AI service
    const extractedSpec = await this.searchService.extractSpec(dto.queryText);

    // 2. Perform immediate semantic search
    const searchResult = await this.searchService.search({
      query: dto.queryText,
      location: dto.location,
      radiusKm: dto.radiusKm ?? 50,
      filters: {},
    });

    // 3. Save demand
    const demand = this.demandRepo.create({
      buyerId,
      queryText: dto.queryText,
      extractedSpec,
      lat: dto.location.lat,
      lng: dto.location.lng,
      radiusKm: dto.radiusKm ?? 50,
      notifyChannel: dto.notifyChannel ?? 'push',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      status: searchResult.results.length > 0 ? 'matched' : 'waiting',
    });
    const saved = await this.demandRepo.save(demand);

    // 4. Save matches if found
    if (searchResult.results.length > 0) {
      const matches = searchResult.results.slice(0, 10).map((r) =>
        this.matchRepo.create({
          demandId: saved.id,
          listingId: r.listing.id,
          scoreVector: r.scoreVector,
          scoreGeo: r.scoreGeo,
          scoreTotal: r.scoreTotal,
          distanceKm: r.distanceKm,
        }),
      );
      await this.matchRepo.save(matches);
    }

    return { demand: saved, searchResult };
  }

  findByBuyer(buyerId: string) {
    return this.demandRepo.find({
      where: { buyerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const demand = await this.demandRepo.findOne({ where: { id } });
    if (!demand) throw new NotFoundException('수요를 찾을 수 없습니다.');
    return demand;
  }

  async findMatches(demandId: string) {
    return this.matchRepo.find({
      where: { demandId },
      relations: ['listing'],
      order: { scoreTotal: 'DESC' },
    });
  }

  async cancel(id: string, buyerId: string) {
    const demand = await this.findOne(id);
    if (demand.buyerId !== buyerId) throw new NotFoundException();
    await this.demandRepo.update(id, { status: 'expired' });
  }

  findWaiting() {
    return this.demandRepo.find({ where: { status: 'waiting' } });
  }
}
