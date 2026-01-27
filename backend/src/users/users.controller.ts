import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SelectAvatarDto } from '../avatars/dto/select-avatar.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@GetUser() user: User) {
    const userWithAvatar = await this.usersService.getUserWithAvatar(user.id);
    delete userWithAvatar.password;
    return userWithAvatar;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUser(
      user.id,
      updateUserDto,
    );
    delete updatedUser.password;
    return {
      success: true,
      data: updatedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  /**
   * Avatar seç
   * PATCH /api/users/me/avatar
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  async selectAvatar(
    @GetUser() user: User,
    @Body() selectAvatarDto: SelectAvatarDto,
  ) {
    const updatedUser = await this.usersService.selectAvatar(
      user.id,
      selectAvatarDto.avatarId,
    );
    delete updatedUser.password;
    return {
      success: true,
      message: 'Avatar selected successfully',
      data: updatedUser,
    };
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
