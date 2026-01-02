import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  async findAllForUser(@GetUser() user: User) {
    const { systemSubjects, customSubjects } = await this.subjectsService.findAllForUser(user);

    // Return only the data payload. The ResponseInterceptor will handle the wrapping.
    return {
      systemSubjects,
      customSubjects,
    };
  }
}
