import { Body, Controller, Get, Post } from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}
  @Post('/enter')
  async enterBossRaid(@Body() enterBossRaidDto: EnterBossRaidDto) {
    const result = this.bossRaidService.enter(enterBossRaidDto);
    return result;
  }
  @Get('')
  async getBossRaidStatus() {
    const result = this.bossRaidService.getBossRaidStatus();
    return result;
  }
}
