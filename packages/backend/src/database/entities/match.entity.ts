import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DemandEntity } from './demand.entity';
import { ListingEntity } from './listing.entity';

@Entity('matches')
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DemandEntity, (d) => d.matches)
  @JoinColumn({ name: 'demand_id' })
  demand: DemandEntity;

  @Column({ name: 'demand_id' })
  demandId: string;

  @ManyToOne(() => ListingEntity)
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({ name: 'listing_id' })
  listingId: string;

  @Column({ type: 'numeric', precision: 5, scale: 4, name: 'score_vector' })
  scoreVector: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, name: 'score_geo' })
  scoreGeo: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, name: 'score_total' })
  scoreTotal: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, name: 'distance_km' })
  distanceKm: number;

  @Column({ nullable: true, name: 'notified_at' })
  notifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
