import {
  DEFAULT_REDIS_NAMESPACE,
  getRedisToken,
} from '@liaoliaots/nestjs-redis';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { IsNull, QueryRunner, Repository } from 'typeorm';
import { BossRaidService } from './boss-raid.service';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';
import { BossRaidHistory } from './entity/boss-raid-history.entity';
import { HttpModule } from '@nestjs/axios';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { RankService } from 'src/rank/rank.service';
const qr = {
  manager: { update: jest.fn(), save: jest.fn() },
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  release: jest.fn(),
  rollbackTransaction: jest.fn(),
} as unknown as QueryRunner;

const mockBossRaidRepository = () => ({
  create: jest.fn(() => {
    return {
      raidRecordId: 1,
    };
  }),
  save: jest.fn(),
  findOne: jest.fn(),
  manager: {
    connection: {
      createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
        return qr;
      },
    },
  },
});

const mockUserRepository = () => ({
  findOne: jest.fn(() => {
    return {
      id: 1,
      totalScore: 100,
      bossRaidHistory: null,
    };
  }),
  manager: {
    connection: {
      createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
        return qr;
      },
    },
  },
});
const mockRedis = () => ({
  get: jest.fn((e) => {
    if (e === 'levels') {
      return '[{"level":0,"score":20},{"level":1,"score":47},{"level":2,"score":85}]';
    } else {
      return '180';
    }
  }),
  set: jest.fn(),
  zadd: jest.fn(),
  zrevrank: jest.fn(() => {
    return 2;
  }),
  zscore: jest.fn(() => {
    return '132';
  }),
  zrevrange: jest.fn(() => {
    return [
      '{"userId":3}',
      '132',
      '{"userId":5}',
      '132',
      '{"userId":1}',
      '132',
      '{"userId":4}',
      '85',
      '{"userId":2}',
      '85',
    ];
  }),
});
describe('BossRaidService', () => {
  let service: BossRaidService;
  let spyRepository: Repository<BossRaidHistory>;
  let spyUserService: UserService;
  let spyRedis: Redis;
  let spyRankService: RankService;
  beforeEach(async () => {
    qr.startTransaction = jest.fn();
    qr.commitTransaction = jest.fn();
    qr.rollbackTransaction = jest.fn();
    qr.release = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        BossRaidService,
        UserService,
        RankService,
        {
          provide: getRedisToken(DEFAULT_REDIS_NAMESPACE),
          useFactory: mockRedis,
        },
        {
          provide: getRepositoryToken(BossRaidHistory),
          useFactory: mockBossRaidRepository,
        },
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
      ],
    }).compile();
    spyRedis = module.get<Redis>(getRedisToken(DEFAULT_REDIS_NAMESPACE));
    service = module.get<BossRaidService>(BossRaidService);
    spyRepository = module.get(getRepositoryToken(BossRaidHistory));
    spyUserService = module.get<UserService>(UserService);
    spyRankService = module.get<RankService>(RankService);
  });

  it('enter() - 성공', async () => {
    const user: User = {
      id: 1,
      totalScore: 100,
      bossRaidHistory: null,
    };
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 1,
    };
    const queryRunner = spyRepository.manager.connection.createQueryRunner();
    spyUserService.getUserById = jest.fn(async () => {
      return user;
    });

    const result = await service.enter(enterBossRaidDto);

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.save).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(spyUserService.getUserById).toHaveBeenCalled();
    expect(spyUserService.getUserById).toHaveBeenCalledWith(
      enterBossRaidDto.userId,
    );
    expect(spyRepository.findOne).toHaveBeenCalled();
    expect(spyRepository.findOne).toHaveBeenCalledWith({
      where: { endTime: IsNull() },
    });
    expect(spyRepository.create).toHaveBeenCalled();
    expect(spyRepository.create).toHaveBeenCalledWith({
      user,
      level: enterBossRaidDto.level,
    });
    expect(result).toEqual({ isEntered: true, raidRecordId: 1 });
  });

  it('getBossRaidStatus() - 성공', async () => {
    const result = await service.getBossRaidStatus();

    expect(spyRepository.findOne).toHaveBeenCalled();
    expect(spyRepository.findOne).toHaveBeenCalledWith({
      where: { endTime: IsNull() },
      relations: ['user'],
    });
    expect(result).toEqual({ canEnter: true });
  });

  it('endBossRaid() - 성공', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 1,
      raidRecordId: 1,
    };
    const user: User = {
      id: 1,
      totalScore: 100,
      bossRaidHistory: null,
    };
    const bossRaidHistory: BossRaidHistory = {
      raidRecordId: 1,
      level: 1,
      enterTime: new Date(),
      user: user,
    };
    spyRepository.findOne = jest.fn(async () => {
      return bossRaidHistory;
    });
    spyRankService.insertRanking = jest.fn();

    const queryRunner = spyRepository.manager.connection.createQueryRunner();

    await service.endBossRaid(endBossRaidDto);

    expect(spyRepository.findOne).toHaveBeenCalled();
    expect(spyRepository.findOne).toHaveBeenCalledWith({
      where: { raidRecordId: endBossRaidDto.raidRecordId, endTime: IsNull() },
      relations: ['user'],
    });
    expect(spyRankService.insertRanking).toHaveBeenCalled();
    expect(spyRankService.insertRanking).toHaveBeenCalledWith(
      user.totalScore + 47,
      user.id,
    );
    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.update).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('getBossRaidRanking() - 성공', async () => {
    const userId = 1;
    spyRankService.getrankingList = jest.fn(async () => {
      return [
        {
          ranking: 0,
          userId: 3,
          totalScore: 132,
        },
        {
          ranking: 1,
          userId: 5,
          totalScore: 132,
        },
        {
          ranking: 2,
          userId: 1,
          totalScore: 132,
        },
        {
          ranking: 3,
          userId: 4,
          totalScore: 85,
        },
        {
          ranking: 4,
          userId: 2,
          totalScore: 85,
        },
      ];
    });
    spyRankService.getranking = jest.fn(async () => {
      return {
        ranking: 2,
        userId: 1,
        totalScore: 132,
      };
    });

    const result = await service.getBossRaidRanking(userId);

    expect(spyRankService.getrankingList).toHaveBeenCalled();
    expect(spyRankService.getrankingList).toHaveBeenCalledWith(0, -1, true);
    expect(spyRankService.getranking).toHaveBeenCalled();
    expect(spyRankService.getranking).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      topRankerInfoList: [
        {
          ranking: 0,
          userId: 3,
          totalScore: 132,
        },
        {
          ranking: 1,
          userId: 5,
          totalScore: 132,
        },
        {
          ranking: 2,
          userId: 1,
          totalScore: 132,
        },
        {
          ranking: 3,
          userId: 4,
          totalScore: 85,
        },
        {
          ranking: 4,
          userId: 2,
          totalScore: 85,
        },
      ],
      myRankingInfo: {
        ranking: 2,
        userId: 1,
        totalScore: 132,
      },
    });
  });

  it('isBossRaidLevel() - 성공', async () => {
    const level = 1;

    const result = await service.isBossRaidLevel(level);

    expect(spyRedis.get).toHaveBeenCalled();
    expect(spyRedis.get).toHaveBeenCalledWith('levels');
    expect(result).toEqual(true);
  });

  it('getBossRaidScoreByLevel() - 성공', async () => {
    const level = 1;

    const result = await service.getBossRaidScoreByLevel(level);

    expect(spyRedis.get).toHaveBeenCalled();
    expect(spyRedis.get).toHaveBeenCalledWith('levels');
    expect(result).toEqual(47);
  });

  it('isTimeOver() - 성공', async () => {
    const endTime = new Date();

    const result = await service.isTimeOver(endTime);

    expect(spyRedis.get).toHaveBeenCalled();
    expect(spyRedis.get).toHaveBeenCalledWith('bossRaidLimitSeconds');
    expect(result).toEqual(false);
  });
});
