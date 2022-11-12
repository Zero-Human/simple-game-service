import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RaidModule } from './raid/raid.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfigModule } from './config/config.module';
import { MySqlConfigService } from './config/config.service';

@Module({
  imports: [
    UserModule,
    RaidModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
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
