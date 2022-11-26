import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { BossRaidService } from './boss-raid.service';
import { EndBossRaidDto } from './dto/end-boss-raid.dto';
import { EnterBossRaidDto } from './dto/enter-boss-raid.dto';

@Controller('bossRaid')
export class BossRaidController {
  constructor(private readonly bossRaidService: BossRaidService) {}
  @Post('/enter')
  async enterBossRaid(@Body() enterBossRaidDto: EnterBossRaidDto) {
    const result = await this.bossRaidService.enter(enterBossRaidDto);
    return result;
  }
  @Get('')
  async getBossRaidStatus() {
    const result = await this.bossRaidService.getBossRaidStatus();
    return result;
  }
  @Patch('/end')
  async endBossRaid(@Body() endBossRaidDto: EndBossRaidDto) {
    await this.bossRaidService.endBossRaid(endBossRaidDto);
  }
  @Get('/topRankerList')
  async getBossRaidRank(@Body('userId', ParseIntPipe) userId: number) {
    const result = await this.bossRaidService.getBossRaidRanking(userId);
    return result;
  }
}
