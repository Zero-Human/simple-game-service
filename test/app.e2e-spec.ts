import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { BossRaidHistory } from 'src/bossRaid/entity/boss-raid-history.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import Redis from 'ioredis';
import {
  DEFAULT_REDIS_NAMESPACE,
  getRedisToken,
} from '@liaoliaots/nestjs-redis';
import { EnterBossRaidDto } from 'src/bossRaid/dto/enter-boss-raid.dto';
import { EndBossRaidDto } from 'src/bossRaid/dto/end-boss-raid.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bossRaidRepository: Repository<BossRaidHistory>;
  let redis: Redis;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    bossRaidRepository = moduleFixture.get(getRepositoryToken(BossRaidHistory));
    userRepository = moduleFixture.get(getRepositoryToken(User));
    redis = moduleFixture.get(getRedisToken(DEFAULT_REDIS_NAMESPACE));
  });
  afterEach(async () => {
    // e2e 테스트가 끝나면 db를 drop해야 함
    await Promise.all([
      await redis.flushall(),
      await bossRaidRepository.query('DROP TABLE boss_raid_history'),
      await userRepository.query('DROP TABLE users'),
    ]);
  });

  it('/user (POST) - 성공', () => {
    return request(app.getHttpServer())
      .post('/user')
      .expect(201)
      .expect({ userId: 1 });
  });

  it('/user/:id (GET) - 성공', async () => {
    const user = userRepository.create();
    await userRepository.save(user);
    return request(app.getHttpServer()).get('/user/1').expect(200).expect({
      totalScore: user.totalScore,
      bossRaidHistory: [],
    });
  });

  it('/user/:id (GET) - 실패 경로변수 타입이 잘못된 경우', async () => {
    return request(app.getHttpServer()).get('/user/test').expect(400).expect({
      statusCode: 400,
      message: 'Validation failed (numeric string is expected)',
      error: 'Bad Request',
    });
  });

  it('/user/:id (GET) - 실패 없는 유저일 경우', async () => {
    return request(app.getHttpServer()).get('/user/1').expect(400).expect({
      statusCode: 400,
      message: '없는 유저입니다.',
      error: 'Bad Request',
    });
  });

  it('/bossRaid/enter (POST) - 성공', async () => {
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 1,
    };
    const user = userRepository.create();
    await userRepository.save(user);
    return request(app.getHttpServer())
      .post('/bossRaid/enter')
      .send(enterBossRaidDto)
      .expect(201)
      .expect({ isEntered: true, raidRecordId: 1 });
  });

  it('/bossRaid/enter (POST) - 성공 다른 사람이 레이드 중인 경우', async () => {
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 1,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);
    return request(app.getHttpServer())
      .post('/bossRaid/enter')
      .send(enterBossRaidDto)
      .expect(201)
      .expect({ isEntered: false });
  });

  it('/bossRaid/enter (POST) - 실패 body 인자가 잘못된 경우', async () => {
    const data = { userId: 1 };
    const user = userRepository.create();
    await userRepository.save(user);
    return request(app.getHttpServer())
      .post('/bossRaid/enter')
      .send(data)
      .expect(400)
      .expect({
        statusCode: 400,
        message: [
          'level must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
  });

  it('/bossRaid/enter (POST) - 실패 유저가 없는 경우', async () => {
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 1,
    };

    return request(app.getHttpServer())
      .post('/bossRaid/enter')
      .send(enterBossRaidDto)
      .expect(400)
      .expect({
        statusCode: 400,
        message: '없는 유저입니다.',
        error: 'Bad Request',
      });
  });

  it('/bossRaid/enter (POST) - 실패 해당 레벨이 없는 경우', async () => {
    const enterBossRaidDto: EnterBossRaidDto = {
      userId: 1,
      level: 4,
    };
    const user = userRepository.create();
    await userRepository.save(user);

    return request(app.getHttpServer())
      .post('/bossRaid/enter')
      .send(enterBossRaidDto)
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'level 설정이 잘못되었습니다.',
        error: 'Bad Request',
      });
  });

  it('/bossRaid (GET) - 성공', async () => {
    return request(app.getHttpServer()).get('/bossRaid').expect(200).expect({
      canEnter: true,
    });
  });

  it('/bossRaid (GET) - 성공 사람이 있는 경우', async () => {
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer()).get('/bossRaid').expect(200).expect({
      canEnter: false,
      enteredUserId: 1,
    });
  });

  it('/bossRaid/end (PATCH) - 성공 ', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 1,
      raidRecordId: 1,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .patch('/bossRaid/end')
      .send(endBossRaidDto)
      .expect(200);
  });

  it('/bossRaid/end (PATCH) - 실패 body 인자가 잘못된 경우 ', async () => {
    const endBossRaidDto = {
      userId: 1,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .patch('/bossRaid/end')
      .send(endBossRaidDto)
      .expect(400)
      .expect({
        statusCode: 400,
        message: [
          'raidRecordId must be a number conforming to the specified constraints',
        ],
        error: 'Bad Request',
      });
  });

  it('/bossRaid/end (PATCH) - 실패 보스레드 아이디 잘못된 경우 ', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 1,
      raidRecordId: 2,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .patch('/bossRaid/end')
      .send(endBossRaidDto)
      .expect(400)
      .expect({
        statusCode: 400,
        message: '보스레이드아이디가 잘못되었습니다.',
        error: 'Bad Request',
      });
  });

  it('/bossRaid/end (PATCH) - 실패 유저 아이디 잘못된 경우 ', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 2,
      raidRecordId: 1,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({ user: resultUser, level: 1 });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .patch('/bossRaid/end')
      .send(endBossRaidDto)
      .expect(400)
      .expect({
        statusCode: 400,
        message: '유저아이디가 잘못되었습니다.',
        error: 'Bad Request',
      });
  });

  it('/bossRaid/end (PATCH) - 실패 타임 아웃난 경우', async () => {
    const endBossRaidDto: EndBossRaidDto = {
      userId: 1,
      raidRecordId: 1,
    };
    const user = userRepository.create();
    const resultUser = await userRepository.save(user);
    const bossRaid = bossRaidRepository.create({
      user: resultUser,
      level: 1,
      enterTime: new Date(2020, 11, 11),
    });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .patch('/bossRaid/end')
      .send(endBossRaidDto)
      .expect(404)
      .expect({
        statusCode: 404,
        message: '타임아웃되었습니다.',
        error: 'Not Found',
      });
  });

  it('/bossRaid/topRankerList (GET) - 성공', async () => {
    const user = userRepository.create();
    user.totalScore = 100;
    const resultUser = await userRepository.save(user);
    redis.zadd(
      'rank',
      100,
      JSON.stringify({
        userId: 1,
      }),
    );
    const bossRaid = bossRaidRepository.create({
      user: resultUser,
      level: 1,
      endTime: new Date(),
      score: 40,
    });
    await bossRaidRepository.save(bossRaid);

    return request(app.getHttpServer())
      .get('/bossRaid/topRankerList')
      .send({ userId: 1 })
      .expect(200)
      .expect({
        topRankerInfoList: [{ ranking: 0, userId: 1, totalScore: 100 }],
        myRankingInfo: { ranking: 0, userId: 1, totalScore: 100 },
      });
  });
  it('/bossRaid/topRankerList (GET) - 실패 해당 유저가 없는 경우', async () => {
    return request(app.getHttpServer())
      .get('/bossRaid/topRankerList')
      .send({ userId: 1 })
      .expect(400)
      .expect({
        statusCode: 400,
        message: '없는 유저입니다.',
        error: 'Bad Request',
      });
  });
});
