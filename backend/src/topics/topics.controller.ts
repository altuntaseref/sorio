import { Controller, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopicsService } from './topics.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Put(':topicId')
  async update(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @GetUser() user: User,
  ) {
    const updatedTopic = await this.topicsService.update(topicId, updateTopicDto, user);
    return {
      success: true,
      data: {
        topic: updatedTopic,
      },
    };
  }

  @Delete(':topicId')
  async remove(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @GetUser() user: User,
  ) {
    await this.topicsService.remove(topicId, user);
    return {
      success: true,
      message: 'Topic deleted successfully',
    };
  }
}
