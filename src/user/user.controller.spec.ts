import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
const mockService = () => ({
  createUser: jest.fn(() => 1),
  getUserById: jest.fn(() => {
    return {
      totalScore: 1,
      bossRaidHistory: 1,
    };
  }),
});
describe('UserController', () => {
  let controller: UserController;
  let spyService: UserService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useFactory: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    spyService = module.get<UserService>(UserService);
  });

  it('POST /user - 성공', async () => {
    const result = await controller.createUser();

    expect(spyService.createUser).toHaveBeenCalled();
    expect(spyService.createUser).toHaveBeenCalledWith();
    expect(result).toEqual({
      userId: 1,
    });
  });

  it('GET /user/:id - 성공', async () => {
    const result = await controller.getUser(1);

    expect(spyService.getUserById).toHaveBeenCalled();
    expect(spyService.getUserById).toHaveBeenCalledWith(1);
    expect(result).toEqual(
      Object.assign({
        totalScore: 1,
        bossRaidHistory: 1,
      }),
    );
  });
});
