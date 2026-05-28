import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ListingStatus, ListingCondition, PriceType, ExtractedSpec, Dimensions } from '@kosmes/shared';
import { UserEntity } from './user.entity';

@Entity('listings')
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true, name: 'external_id' })
  externalId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, name: 'category_l1' })
  categoryL1: string;

  @Column({ nullable: true, name: 'category_l2' })
  categoryL2: string;

  @Column({ type: 'numeric', precision: 15, scale: 0, nullable: true })
  price: number;

  @Column({ type: 'varchar', length: 16, default: 'unknown', name: 'price_type' })
  priceType: PriceType;

  @Column({ nullable: true })
  voltage: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, name: 'power_kw' })
  powerKw: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, name: 'weight_kg' })
  weightKg: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: Dimensions;

  @Column({ type: 'varchar', length: 16, nullable: true })
  condition: ListingCondition;

  @Column({ type: 'text', nullable: true, name: 'location_text' })
  locationText: string;

  // PostGIS Point stored as well-known text via raw query; lat/lng stored separately for ORM convenience
  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({ type: 'jsonb', nullable: true, name: 'extracted_spec' })
  extractedSpec: ExtractedSpec;

  @Column({ type: 'text', array: true, default: [], name: 'image_urls' })
  imageUrls: string[];

  @Column({ nullable: true, name: 'embedding_id' })
  embeddingId: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: ListingStatus;

  @ManyToOne(() => UserEntity, (u) => u.listings, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: UserEntity;

  @Column({ nullable: true, name: 'seller_id' })
  sellerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
