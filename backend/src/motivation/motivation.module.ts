import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotivationService } from './motivation.service';
import { MotivationController } from './motivation.controller';
import { MotivationQuote } from './entities/motivation-quote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MotivationQuote])],
  controllers: [MotivationController],
  providers: [MotivationService],
  exports: [MotivationService],
})
export class MotivationModule {}

