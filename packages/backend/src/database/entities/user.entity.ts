import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '@kosmes/shared';
import { ListingEntity } from './listing.entity';
import { DemandEntity } from './demand.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 16 })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, name: 'kakao_user_id' })
  kakaoUserId: string;

  @Column({ nullable: true, name: 'push_token', type: 'text' })
  pushToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ListingEntity, (l) => l.seller)
  listings: ListingEntity[];

  @OneToMany(() => DemandEntity, (d) => d.buyer)
  demands: DemandEntity[];
}
