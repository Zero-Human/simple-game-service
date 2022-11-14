import { IsNumber } from 'class-validator';

export class EnterBossRaidDto {
  @IsNumber()
  userId: number;
  @IsNumber()
  level: number;
}
