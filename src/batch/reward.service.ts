import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RankService } from '../rank/rank.service';
import { UserService } from '../user/user.service';

@Injectable()
export class RewardService {
  constructor(
    private readonly rankService: RankService,
    private readonly userService: UserService,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    timeZone: 'Asia/Seoul',
  })
  async topRankingReward() {
    const data = await this.rankService.getrankingList(0, 4, true);
    for (const user of data) {
      await this.userService.updateUserTotalScore(
        user.userId,
        user.totalScore + 100,
      );
      await this.rankService.insertRanking(user.totalScore + 100, user.userId);
    }
  }
}
