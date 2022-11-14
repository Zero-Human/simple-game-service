import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './entity/user.entity';

const UserRepositoryProvider = {
  provide: getRepositoryToken(User),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(User);
  },
};

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UserRepositoryProvider],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
