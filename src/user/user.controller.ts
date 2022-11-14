import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('')
  async createUser() {
    const userId = await this.userService.createUser();
    return Object.assign({
      userId,
    });
  }
  @Get('/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getUserById(id);
    return Object.assign({
      totalScore: user.totalScore,
      bossRaidHistory: user.bossRaidHistory,
    });
  }
}
