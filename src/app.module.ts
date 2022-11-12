import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RaidModule } from './raid/raid.module';

@Module({
  imports: [UserModule, RaidModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
