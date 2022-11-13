import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { BossRaidModule } from './bossRaid/boss-raid.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfigModule } from './config/config.module';
import { MySqlConfigService } from './config/config.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    UserModule,
    BossRaidModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forRootAsync({
      imports: [MySqlConfigModule],
      useClass: MySqlConfigService,
      inject: [MySqlConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
