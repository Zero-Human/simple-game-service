import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { IsNull } from 'typeorm';
import { BossRaidRepository } from './boss-raid.repository';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { BossRaidHistory } from './entity/boss-raid-history.entity';

@Injectable()
export class BossRaidService {
  constructor(
    @InjectRepository(BossRaidHistory)
    private readonly bossRaidRepository: BossRaidRepository,
    private readonly userService: UserService,
  ) {}
  readonly getURL = `https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json`;

  async enter(enterBossRaidDto: EnterBossRaidDto) {
    const user = await this.userService.GetUserById(enterBossRaidDto.userId);
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }
    // TODO: level 확인해야합니다.
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
    await this.bossRaidRepository.save(data);
    return { isEntered: true, raidRecordId: data.raidRecordId };
  }

  async getBossRaidStatus() {
    const enterUser = await this.bossRaidRepository.findOne({
      where: { endTime: IsNull() },
      relations: ['user'],
    });
    if (enterUser) {
      const isTimeOver = this.isTimeOver(enterUser.enterTime);
      if (!isTimeOver) {
        return { canEnter: false, enteredUserId: enterUser.user.id };
      }
    }
    return { canEnter: true };
  }

  isTimeOver(enterTime: Date) {
    return new Date().getTime() - enterTime.getTime() > 180000; // TODO 여기에 타임오버 시간 넣어야한다.
  }
}
