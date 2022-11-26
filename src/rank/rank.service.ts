import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RankingInfo } from 'src/bossRaid/interface/ranking-info.interface';

@Injectable()
export class RankService {
  private RANKING_KEY = 'rank';
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async insertRanking(totalScore: number, userId: number) {
    await this.redis.zadd(
      this.RANKING_KEY,
      totalScore,
      JSON.stringify({
        userId: userId,
      }),
    );
  }

  async getrankingList(
    start: number,
    end: number,
    withScore: boolean,
  ): Promise<RankingInfo[]> {
    let data;
    if (withScore) {
      data = await this.redis.zrevrange(
        this.RANKING_KEY,
        start,
        end,
        'WITHSCORES',
      );
    } else {
      data = await this.redis.zrevrange(this.RANKING_KEY, start, end);
    }

    const topRankerInfoList: RankingInfo[] = [];
    data.filter((value, index) => {
      const ranking = Math.floor(index / 2);
      if (index % 2 === 0 || withScore == false) {
        const rankinginfo: RankingInfo = {
          ranking: withScore ? ranking : index,
          userId: parseInt(JSON.parse(value).userId),
          totalScore: null,
        };
        topRankerInfoList.push(rankinginfo);
      } else {
        topRankerInfoList[ranking].totalScore = parseInt(value);
      }
    });

    return topRankerInfoList;
  }

  async getranking(userId: number): Promise<RankingInfo> {
    const ranking = await this.redis.zrevrank(
      this.RANKING_KEY,
      JSON.stringify({ userId }),
    );
    const totalScore = await this.redis.zscore(
      this.RANKING_KEY,
      JSON.stringify({ userId }),
    );
    const rankingInfo: RankingInfo = {
      ranking,
      userId,
      totalScore: totalScore ? parseInt(totalScore) : null,
    };
    return rankingInfo;
  }
}
