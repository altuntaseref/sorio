import { Module } from '@nestjs/common';
import { R2Service } from './r2.service';
import { UploadController } from './upload.controller';

@Module({
  providers: [R2Service],
  exports: [R2Service],
  controllers: [UploadController],
})
export class UploadModule {}
