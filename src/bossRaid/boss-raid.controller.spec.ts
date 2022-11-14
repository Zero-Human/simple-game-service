import { Test, TestingModule } from '@nestjs/testing';
import { BossRaidController } from './boss-raid.controller';

describe('BossRaidController', () => {
  let controller: BossRaidController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BossRaidController],
    }).compile();

    controller = module.get<BossRaidController>(BossRaidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
