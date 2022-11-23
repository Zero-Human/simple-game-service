import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';

@Injectable()
export class RewardService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'cronTask',
    timeZone: 'Asia/Seoul',
  })
  async topRankingReward() {
    const data = await this.redis.zrevrange('rank', 0, 20, 'WITHSCORES');
    console.log(`${new Date().getTime()} // ${data}`);
  }
}
