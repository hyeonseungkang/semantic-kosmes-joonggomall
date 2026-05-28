import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ListingEntity } from '../../database/entities/listing.entity';
import { GeoService } from '../geo/geo.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingQueryDto } from './dto/listing-query.dto';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingEntity) private repo: Repository<ListingEntity>,
    private geoService: GeoService,
  ) {}

  async create(dto: CreateListingDto, sellerId: string) {
    let lat: number | undefined;
    let lng: number | undefined;

    if (dto.locationText) {
      const point = await this.geoService.geocode(dto.locationText);
      if (point) {
        lat = point.lat;
        lng = point.lng;
      }
    } else if (dto.location) {
      lat = dto.location.lat;
      lng = dto.location.lng;
    }

    const listing = this.repo.create({ ...dto, lat, lng, sellerId });
    return this.repo.save(listing);
  }

  async findAll(query: ListingQueryDto) {
    const where: FindManyOptions<ListingEntity>['where'] = { status: 'active' };
    if (query.categoryL1) Object.assign(where, { categoryL1: query.categoryL1 });
    if (query.voltage) Object.assign(where, { voltage: query.voltage });

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: query.limit ?? 20,
      skip: query.offset ?? 0,
    });
    return { items, total };
  }

  async findOne(id: string) {
    const listing = await this.repo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('매물을 찾을 수 없습니다.');
    return listing;
  }

  async findMapPins(lat: number, lng: number, radiusKm: number) {
    return this.repo
      .createQueryBuilder('l')
      .select(['l.id', 'l.title', 'l.price', 'l.lat', 'l.lng'])
      .where('l.status = :status', { status: 'active' })
      .andWhere('l.lat IS NOT NULL')
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(l.lat)) *
            cos(radians(l.lng) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(l.lat))
          )
        ) <= :radius`,
        { lat, lng, radius: radiusKm },
      )
      .getMany();
  }

  async update(id: string, updates: Partial<ListingEntity>, userId: string) {
    const listing = await this.findOne(id);
    if (listing.sellerId !== userId) throw new ForbiddenException();
    await this.repo.update(id, updates);
    return this.findOne(id);
  }

  async softDelete(id: string, userId: string) {
    const listing = await this.findOne(id);
    if (listing.sellerId !== userId) throw new ForbiddenException();
    await this.repo.update(id, { status: 'expired' });
  }

  updateEmbeddingId(id: string, embeddingId: string) {
    return this.repo.update(id, { embeddingId });
  }

  findPendingEmbedding() {
    return this.repo.find({ where: { embeddingId: undefined, status: 'active' }, take: 100 });
  }
}
