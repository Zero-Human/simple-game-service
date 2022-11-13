import { Module } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { BossRaidController } from './boss-raid.controller';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { BossRaidHistory } from './entity/boss-raid-history.entity';
import { HttpModule } from '@nestjs/axios';
import { DataSource } from 'typeorm';
import { customBossRaidRepositoryMethods } from './boss-raid.repository';
import { UserModule } from 'src/user/user.module';

const BossRaidRepositoryProvider = {
  provide: getRepositoryToken(BossRaidHistory),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource
      .getRepository(BossRaidHistory)
      .extend(customBossRaidRepositoryMethods);
  },
};
@Module({
  imports: [
    TypeOrmModule.forFeature([BossRaidHistory]),
    HttpModule,
    UserModule,
  ],
  providers: [BossRaidService, BossRaidRepositoryProvider],
  controllers: [BossRaidController],
})
export class BossRaidModule {}
