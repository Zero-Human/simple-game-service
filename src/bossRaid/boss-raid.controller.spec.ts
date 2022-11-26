import { Test, TestingModule } from '@nestjs/testing';
import { BossRaidController } from './boss-raid.controller';
import { BossRaidService } from './boss-raid.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { RankingInfo } from './interface/ranking-info.interface';
const mockService = () => ({
  enter: jest.fn(() => {
    return {
      isEntered: true,
      raidRecordId: 1,
    };
  }),
  getBossRaidStatus: jest.fn(() => {
    return {
      canEnter: true,
    };
  }),
  endBossRaid: jest.fn(),
  getBossRaidRanking: jest.fn(() => {
    const topRankerInfoList: RankingInfo = {
      ranking: 1,
      userId: 1,
      totalScore: 1,
    };
    const myRankingInfo: RankingInfo = {
      ranking: 1,
      userId: 1,
      totalScore: 1,
    };
    return { topRankerInfoList, myRankingInfo };
  }),
});

describe('BossRaidController', () => {
  let controller: BossRaidController;
  let spyService: BossRaidService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BossRaidController],
      providers: [
        {
          provide: BossRaidService,
          useFactory: mockService,
        },
      ],
    }).compile();

    controller = module.get<BossRaidController>(BossRaidController);
    spyService = module.get<BossRaidService>(BossRaidService);
  });

  it('POST /bossRaid/enter 성공', async () => {
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 1,
    };

    const result = await controller.enterBossRaid(enterBossRaidDto);

    expect(spyService.enter).toHaveBeenCalled();
    expect(spyService.enter).toHaveBeenCalledWith(enterBossRaidDto);
    expect(result).toEqual({
      isEntered: true,
      raidRecordId: 1,
    });
  });

  it('GET /bossRaid 성공', async () => {
    const result = await controller.getBossRaidStatus();

    expect(spyService.getBossRaidStatus).toHaveBeenCalled();
    expect(spyService.getBossRaidStatus).toHaveBeenCalledWith();
    expect(result).toEqual({
      canEnter: true,
    });
  });

  it('GET /bossRaid 사람 있는 경우', async () => {
    spyService.getBossRaidStatus = jest.fn(async () => {
      return { canEnter: false, enteredUserId: 1 };
    });
    const result = await controller.getBossRaidStatus();

    expect(spyService.getBossRaidStatus).toHaveBeenCalled();
    expect(spyService.getBossRaidStatus).toHaveBeenCalledWith();
    expect(result).toEqual({
      canEnter: false,
      enteredUserId: 1,
    });
  });

  it('PATCH /bossRaid/end 성공', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 1,
      raidRecordId: 1,
    };

    await controller.endBossRaid(endBossRaidDto);

    expect(spyService.endBossRaid).toHaveBeenCalled();
    expect(spyService.endBossRaid).toHaveBeenCalledWith(endBossRaidDto);
  });

  it('GET /bossRaid/topRankerList 성공', async () => {
    const topRankerInfoList: RankingInfo = {
      ranking: 1,
      userId: 1,
      totalScore: 1,
    };
    const myRankingInfo: RankingInfo = {
      ranking: 1,
      userId: 1,
      totalScore: 1,
    };
    const userId = 1;

    const result = await controller.getBossRaidRank(userId);

    expect(spyService.getBossRaidRanking).toHaveBeenCalled();
    expect(spyService.getBossRaidRanking).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      topRankerInfoList,
      myRankingInfo,
    });
  });
});
