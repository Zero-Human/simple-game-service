import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { BossRaidModule } from './bossRaid/boss-raid.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MySqlConfigModule } from './config/config.module';
import { MySqlConfigService } from './config/config.service';
import { HttpModule } from '@nestjs/axios';
import * as Joi from 'joi';
@Module({
  imports: [
    UserModule,
    BossRaidModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'test').required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_HOST: Joi.string().required(),
        DB_SCHEMA: Joi.string().required(),
        SYNCHRONIZE: Joi.boolean().required(),
        LOGGING: Joi.boolean().required(),
        TIMEZONE: Joi.string().required(),
      }),
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
