import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
const qr = {
  manager: { update: jest.fn() },
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  release: jest.fn(),
  rollbackTransaction: jest.fn(),
} as unknown as QueryRunner;

const mockPostRepository = () => ({
  create: jest.fn(() => {
    return {
      id: 1,
    };
  }),
  save: jest.fn(),
  findOne: jest.fn((e) => {
    return e;
  }),
  manager: {
    connection: {
      createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
        return qr;
      },
    },
  },
});

describe('UserService', () => {
  let service: UserService;
  let spyRepository: Repository<User>;

  beforeEach(async () => {
    qr.startTransaction = jest.fn();
    qr.commitTransaction = jest.fn();
    qr.rollbackTransaction = jest.fn();
    qr.release = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockPostRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    spyRepository = module.get(getRepositoryToken(User));
  });

  it('createUser() - 성공 ', async () => {
    await service.createUser();

    expect(spyRepository.create).toHaveBeenCalled();
    expect(spyRepository.create).toHaveBeenCalledWith();
    expect(spyRepository.save).toHaveBeenCalled();
    expect(spyRepository.save).toHaveBeenCalledWith({ id: 1 });
  });

  it('getUserById() - 성공 ', async () => {
    const id = 1;
    await service.getUserById(id);

    expect(spyRepository.findOne).toHaveBeenCalled();
    expect(spyRepository.findOne).toHaveBeenCalledWith({
      where: { id },
      relations: ['bossRaidHistory'],
    });
  });

  it('getUserById() - 유저 못찾는 실패 ', async () => {
    spyRepository.findOne = jest.fn(async () => {
      return null;
    });
    const id = 1;

    expect(async () => await service.getUserById(id)).rejects.toThrowError(
      new BadRequestException('없는 유저입니다.'),
    );

    expect(spyRepository.findOne).toHaveBeenCalled();
    expect(spyRepository.findOne).toHaveBeenCalledWith({
      where: { id },
      relations: ['bossRaidHistory'],
    });
  });

  it('updateUserTotalScore() - 성공 ', async () => {
    const id = 1;
    const totalScore = 100;

    const queryRunner = spyRepository.manager.connection.createQueryRunner();

    await service.updateUserTotalScore(id, totalScore);

    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.manager.update).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('updateUserTotalScore() - 실패 ', async () => {
    const id = 1;
    const totalScore = 100;

    const queryRunner = spyRepository.manager.connection.createQueryRunner();

    jest
      .spyOn(queryRunner.manager, 'update')
      .mockRejectedValueOnce(new InternalServerErrorException());

    expect(
      async () => await service.updateUserTotalScore(id, totalScore),
    ).rejects.toThrowError(new InternalServerErrorException());
  });
});
