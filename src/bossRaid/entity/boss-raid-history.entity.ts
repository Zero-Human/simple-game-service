import { User } from 'src/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('boss_raid_history')
export class BossRaidHistory {
  @PrimaryGeneratedColumn({ name: 'raid_Record_Id' })
  raidRecordId: number;

  @Column('int')
  level: number;

  @Column({ type: 'int', default: 0 })
  score?: number;

  @CreateDateColumn({ name: 'enter_time' })
  enterTime: Date;

  @Column({ type: 'timestamp', name: 'end_time', nullable: true })
  endTime?: Date;

  @ManyToOne(() => User, (user) => user.bossRaidHistory)
  user: User;
}
