import { PartialType } from '@nestjs/mapped-types';
import { CreateMotivationQuoteDto } from './create-motivation-quote.dto';

export class UpdateMotivationQuoteDto extends PartialType(
  CreateMotivationQuoteDto,
) {}

