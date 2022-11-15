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
import { UserModule } from 'src/user/user.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

const BossRaidRepositoryProvider = {
  provide: getRepositoryToken(BossRaidHistory),
  inject: [getDataSourceToken()],
  useFactory(dataSource: DataSource) {
    return dataSource.getRepository(BossRaidHistory);
  },
};
@Module({
  imports: [
    TypeOrmModule.forFeature([BossRaidHistory]),
    HttpModule,
    UserModule,
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  providers: [BossRaidService, BossRaidRepositoryProvider],
  controllers: [BossRaidController],
})
export class BossRaidModule {}
