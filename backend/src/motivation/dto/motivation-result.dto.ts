import { QuoteCategory } from '../entities/motivation-quote.entity';

export class MotivationResultDto {
  title: string;
  message: string;
  type: QuoteCategory;
}

