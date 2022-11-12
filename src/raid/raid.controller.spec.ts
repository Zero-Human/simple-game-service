import { Test, TestingModule } from '@nestjs/testing';
import { RaidController } from './raid.controller';

describe('RaidController', () => {
  let controller: RaidController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RaidController],
    }).compile();

    controller = module.get<RaidController>(RaidController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
