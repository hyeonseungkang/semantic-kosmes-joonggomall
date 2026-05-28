import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DemandStatus, NotifyChannel, ExtractedSpec } from '@kosmes/shared';
import { UserEntity } from './user.entity';
import { MatchEntity } from './match.entity';

@Entity('demands')
export class DemandEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (u) => u.demands)
  @JoinColumn({ name: 'buyer_id' })
  buyer: UserEntity;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ type: 'text', name: 'query_text' })
  queryText: string;

  @Column({ type: 'jsonb', nullable: true, name: 'extracted_spec' })
  extractedSpec: ExtractedSpec;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({ default: 50, name: 'radius_km' })
  radiusKm: number;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status: DemandStatus;

  @Column({ type: 'varchar', length: 16, default: 'push', name: 'notify_channel' })
  notifyChannel: NotifyChannel;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => MatchEntity, (m) => m.demand)
  matches: MatchEntity[];
}
