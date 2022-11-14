import { Repository } from 'typeorm';
import { BossRaidHistory } from './entity/boss-raid-history.entity';

export interface BossRaidRepository extends Repository<BossRaidHistory> {
  findOrderByCreateAt(offset: number): Promise<BossRaidHistory>;
}

type CustomBossRaidRepository = Pick<BossRaidRepository, 'findOrderByCreateAt'>;

export const customBossRaidRepositoryMethods: CustomBossRaidRepository = {
  async findOrderByCreateAt(offset: number): Promise<BossRaidHistory> {
    return await this.createQueryBuilder('posts')
      .orderBy('posts.created_at', 'DESC')
      .offset(offset)
      .limit(20)
      .getMany();
  },
};
