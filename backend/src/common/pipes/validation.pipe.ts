import { ValidationPipe, ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GlobalValidationPipe extends ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    return super.transform(value, metadata);
  }
}
