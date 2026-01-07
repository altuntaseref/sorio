import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { CreateMotivationQuoteDto } from './dto/create-motivation-quote.dto';
import { UpdateMotivationQuoteDto } from './dto/update-motivation-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('motivation')
@UseGuards(JwtAuthGuard)
export class MotivationController {
  constructor(private readonly motivationService: MotivationService) {}

  @Post()
  async create(@Body() createMotivationQuoteDto: CreateMotivationQuoteDto) {
    const quote = await this.motivationService.create(createMotivationQuoteDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Motivasyon sözü başarıyla oluşturuldu',
      data: quote,
    };
  }

  @Get()
  async findAll() {
    const quotes = await this.motivationService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Motivasyon sözleri başarıyla getirildi',
      data: quotes,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const quote = await this.motivationService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Motivasyon sözü başarıyla getirildi',
      data: quote,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMotivationQuoteDto: UpdateMotivationQuoteDto,
  ) {
    const quote = await this.motivationService.update(id, updateMotivationQuoteDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Motivasyon sözü başarıyla güncellendi',
      data: quote,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.motivationService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Motivasyon sözü başarıyla silindi',
    };
  }

  @Get('my/current')
  async getMyMotivation(@GetUser('id') userId: string) {
    const motivation = await this.motivationService.getMotivationForUser(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Motivasyon mesajı başarıyla getirildi',
      data: motivation,
    };
  }
}

