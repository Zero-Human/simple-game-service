import { IsNumber } from 'class-validator';

export class EndBossRaidDto {
  @IsNumber()
  userId: number;
  @IsNumber()
  raidRecordId: number;
}
