import { Module } from '@nestjs/common';
import { RaidService } from './raid.service';
import { RaidController } from './raid.controller';

@Module({
  providers: [RaidService],
  controllers: [RaidController]
})
export class RaidModule {}
