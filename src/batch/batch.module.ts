import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RankModule } from 'src/rank/rank.module';
import { UserModule } from 'src/user/user.module';
import { RewardService } from './reward.service';

@Module({
  imports: [ScheduleModule.forRoot(), UserModule, RankModule],
  providers: [RewardService],
  controllers: [],
})
export class BatchModule {}
