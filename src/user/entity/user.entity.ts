import { BossRaidHistory } from '../../bossRaid/entity/boss-raid-history.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'total_score', default: 0 })
  totalScore: number;

  @OneToMany(() => BossRaidHistory, (bossRaidHistory) => bossRaidHistory.user)
  bossRaidHistory: BossRaidHistory;
}
