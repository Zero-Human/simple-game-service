import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser() {
    const user = this.userRepository.create();
    await this.userRepository.save(user);
    return user.id;
  }
  async GetUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['bossRaidHistory'],
    });
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }
    return user;
  }
}
