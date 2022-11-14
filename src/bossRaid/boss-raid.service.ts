import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { IsNull } from 'typeorm';
import { BossRaidRepository } from './boss-raid.repository';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { BossRaidHistory } from './entity/boss-raid-history.entity';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BossRaidService {
  private readonly DATA_URL: string;
  private readonly CONERT_SECOND: number;
  private bossRaidLimitSeconds: number;
  private levels: Array<object>;
  constructor(
    @InjectRepository(BossRaidHistory)
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
    private readonly httpService: HttpService,
  ) {
    this.DATA_URL = `https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json`;
    this.CONERT_SECOND = 1000;
    firstValueFrom(httpService.get(this.DATA_URL)).then((data) => {
      this.bossRaidLimitSeconds = data.data.bossRaids[0].bossRaidLimitSeconds;
      this.levels = data.data.bossRaids[0].levels;
    });
  }

  async enter(enterBossRaidDto: EnterBossRaidDto) {
    const user = await this.userService.getUserById(enterBossRaidDto.userId);
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }
    if (!this.levels.at(enterBossRaidDto.level)) {
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
      if (!this.isTimeOver(enterUser.enterTime)) {
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
    if (this.isTimeOver(enterUser.enterTime)) {
      await this.bossRaidRepository.update(enterUser.raidRecordId, {
        endTime: new Date(),
      });
      throw new NotFoundException('타임아웃되었습니다.');
    }

    const score = this.levels[enterUser.level]['score'];
    const totalScore = enterUser.user.totalScore + score;
    const queryRunner =
      this.bossRaidRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    try {
      await queryRunner.manager.update(
        BossRaidHistory,
        enterUser.raidRecordId,
        {
          endTime: new Date(),
          score,
        },
      );
      await this.userService.updateUserTotalScore(
        enterUser.user.id,
        totalScore,
      );
      await this.redis.zadd(
        'rank',
        totalScore,
        JSON.stringify({
          userId: enterUser.user.id,
        }),
      );
      await queryRunner.commitTransaction();
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  isTimeOver(enterTime: Date) {
    return (
      new Date().getTime() - enterTime.getTime() >
      this.bossRaidLimitSeconds * this.CONERT_SECOND
    );
  }
}
