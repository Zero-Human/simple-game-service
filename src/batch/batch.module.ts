import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RewardService } from './reward.service';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [RewardService],
  controllers: [],
})
export class BatchModule {}
