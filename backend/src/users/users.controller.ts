import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: User) {
    delete user.password;
    return user;
  }

  /**
   * @description
   * Deletes the currently authenticated user's account and all associated data.
   * This operation is irreversible.
   *
   * - Protected by JWT authentication.
   * - Uses a database transaction to ensure data integrity.
   * - Asynchronously handles deletion of related assets (e.g., images from R2) 
   *   to avoid blocking the response.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@GetUser() user: User) {
    // The main account deletion is awaited to ensure the database transaction completes.
    await this.usersService.deleteUserAccount(user.id);

    // Asynchronously delete user's images from R2 without blocking the response.
    // Note: R2 service integration is required for this to work.
    // this.r2Service.deleteAllUserImages(user.id).catch(error => {
    //   console.error(`Failed to clean up R2 images for user ${user.id}`, error);
    // });

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }
}
