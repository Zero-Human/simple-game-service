import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['bossRaidHistory'],
    });
    if (!user) {
      throw new BadRequestException('없는 유저입니다.');
    }
    return user;
  }
  async updateUserTotalScore(userId: number, totalScore: number) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    try {
      await queryRunner.manager.update(User, userId, {
        totalScore,
      });
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }
}
