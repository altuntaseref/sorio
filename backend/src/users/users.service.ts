import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findOneByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder('user')
      .where('user.id = :id', { id })
      .addSelect('user.password')
      .getOne();
  }

  async findOneByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async updateUser(userId: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (typeof updateDto.firstName !== 'undefined') {
      user.firstName = updateDto.firstName;
    }

    if (typeof updateDto.lastName !== 'undefined') {
      user.lastName = updateDto.lastName;
    }

    if (typeof updateDto.avatarUrl !== 'undefined') {
      user.avatarUrl = updateDto.avatarUrl;
    }

    if (typeof updateDto.examTarget !== 'undefined') {
      user.examTarget = updateDto.examTarget;
    }

    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOneByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Password change is not available for this account.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
  }

  async deleteUserAccount(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });

      if (!user) {
        // Although the user should exist due to the guard, this is a good practice.
        throw new Error('User not found'); 
      }

      // The onDelete: 'CASCADE' option in the User entity will handle the deletion
      // of related entities in other tables.
      await queryRunner.manager.remove(user);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // TODO: Add more specific logging for production
      throw new InternalServerErrorException(
        'Failed to delete user account due to a database error.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
