import { IsIn, IsOptional } from 'class-validator';

export class StopTimerDto {
  @IsOptional()
  @IsIn(['COMPLETED', 'ABORTED'])
  status?: 'COMPLETED' | 'ABORTED'; // Default: 'COMPLETED'
}
