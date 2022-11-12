import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RaidModule } from './raid/raid.module';

@Module({
  imports: [UsersModule, RaidModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
