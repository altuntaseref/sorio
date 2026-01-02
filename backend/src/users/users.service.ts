import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
