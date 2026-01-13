import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresetsService } from './presets.service';
import { PresetsController } from './presets.controller';
import { Preset } from './entities/preset.entity';
import { Asset } from '../assets/entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Preset, Asset])],
  controllers: [PresetsController],
  providers: [PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}
