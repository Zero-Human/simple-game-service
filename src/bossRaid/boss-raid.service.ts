import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { IsNull, Repository } from 'typeorm';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { BossRaidHistory } from './entity/boss-raid-history.entity';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RankingInfo } from './interface/ranking-info.interface';

@Injectable()
export class BossRaidService {
  private readonly DATA_URL: string;
  private readonly CONERT_SECOND: number;
  private readonly RANKING_KEY: string;
  private readonly BOSS_RAID_LIMIT_SECONDS_KEY: string;
  private readonly BOSS_RAID_LEVELS_KEY: string;
  constructor(
    @InjectRepository(BossRaidHistory)
    private readonly bossRaidRepository: Repository<BossRaidHistory>,

    private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
    private readonly httpService: HttpService,
  ) {
    this.DATA_URL = `https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json`;
    this.CONERT_SECOND = 1000;
    this.RANKING_KEY = 'rank';
    this.BOSS_RAID_LIMIT_SECONDS_KEY = 'bossRaidLimitSeconds';
    this.BOSS_RAID_LEVELS_KEY = 'levels';
    this.getBossRaidInfo();
  }
  async getBossRaidInfo() {
    firstValueFrom(this.httpService.get(this.DATA_URL)).then((data) => {
      const bossRaidLimitSeconds = data.data.bossRaids[0].bossRaidLimitSeconds;
      const levels = data.data.bossRaids[0].levels;
      this.redis.set(this.BOSS_RAID_LIMIT_SECONDS_KEY, bossRaidLimitSeconds);
      this.redis.set(this.BOSS_RAID_LEVELS_KEY, JSON.stringify(levels));
    });
  }

  async enter(enterBossRaidDto: EnterBossRaidDto) {
    const user = await this.userService.getUserById(enterBossRaidDto.userId);
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }
    if (!(await this.isBossRaidLevel(enterBossRaidDto.level))) {
      throw new BadRequestException('level 설정이 잘못되었습니다.');
    }
    const enterUser = await this.bossRaidRepository.findOne({
      where: { endTime: IsNull() },
    });
    if (enterUser) {
      return { isEntered: false };
    }
    const data = this.bossRaidRepository.create({
      user,
      level: enterBossRaidDto.level,
    });
    const queryRunner =
      this.bossRaidRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    try {
      await queryRunner.manager.save(data);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      queryRunner.release();
    }

    return { isEntered: true, raidRecordId: data.raidRecordId };
  }

  async getBossRaidStatus() {
    const enterUser = await this.bossRaidRepository.findOne({
      where: { endTime: IsNull() },
      relations: ['user'],
    });
    if (enterUser) {
      if (!(await this.isTimeOver(enterUser.enterTime))) {
        return { canEnter: false, enteredUserId: enterUser.user.id };
      }
    }
    return { canEnter: true };
  }

  async endBossRaid(endBossRaidDto: EndBossRaidDto) {
    const enterUser = await this.bossRaidRepository.findOne({
      where: { raidRecordId: endBossRaidDto.raidRecordId, endTime: IsNull() },
      relations: ['user'],
    });
    if (!enterUser) {
      throw new BadRequestException('보스레이드아이디가 잘못되었습니다.');
    }
    if (enterUser.user.id !== endBossRaidDto.userId) {
      throw new BadRequestException('유저아이디가 잘못되었습니다.');
    }
    if (await this.isTimeOver(enterUser.enterTime)) {
      await this.bossRaidRepository.update(enterUser.raidRecordId, {
        endTime: new Date(),
      });
      throw new NotFoundException('타임아웃되었습니다.');
    }

    const score = await this.getBossRaidScoreByLevel(enterUser.level);
    const totalScore = enterUser.user.totalScore + score;
    const queryRunner =
      this.bossRaidRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(
        BossRaidHistory,
        enterUser.raidRecordId,
        {
          endTime: new Date(),
          score,
        },
      );
      await this.redis.zadd(
        this.RANKING_KEY,
        totalScore,
        JSON.stringify({
          userId: enterUser.user.id,
        }),
      );
      await this.userService.updateUserTotalScore(
        enterUser.user.id,
        totalScore,
      );
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async getBossRaidRanking(userId: number) {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }

    const data = await this.redis.zrevrange(
      this.RANKING_KEY,
      0,
      -1,
      'WITHSCORES',
    );

    const topRankerInfoList: RankingInfo[] = [];
    data.filter((value, index) => {
      const ranking = Math.floor(index / 2);
      if (index % 2 === 0) {
        const rankinginfo: RankingInfo = {
          ranking: ranking,
          userId: parseInt(JSON.parse(value).userId),
          totalScore: 0,
        };
        topRankerInfoList.push(rankinginfo);
      } else {
        topRankerInfoList[ranking].totalScore = parseInt(value);
      }
    });
    const myRankingInfo: RankingInfo = {
      ranking: await this.redis.zrevrank(
        this.RANKING_KEY,
        JSON.stringify({ userId }),
      ),
      userId,
      totalScore: parseInt(
        await this.redis.zscore(this.RANKING_KEY, JSON.stringify({ userId })),
      ),
    };

    return { topRankerInfoList, myRankingInfo };
  }

  async isBossRaidLevel(level: number) {
    const result = await this.redis.get(this.BOSS_RAID_LEVELS_KEY);
    const levels: Array<object> = JSON.parse(result);
    return levels.at(level) === undefined ? false : true;
  }
  async getBossRaidScoreByLevel(level: number) {
    const result = await this.redis.get(this.BOSS_RAID_LEVELS_KEY);
    const levels: Array<any> = JSON.parse(result);
    return levels[level].score;
  }
  async isTimeOver(enterTime: Date) {
    const bossRaidLimitSeconds = parseInt(
      await this.redis.get(this.BOSS_RAID_LIMIT_SECONDS_KEY),
    );
    return (
      new Date().getTime() - enterTime.getTime() >
      bossRaidLimitSeconds * this.CONERT_SECOND
    );
  }
}
