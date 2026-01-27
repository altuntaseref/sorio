import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avatar } from './entities/avatar.entity';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectRepository(Avatar)
    private avatarRepository: Repository<Avatar>,
  ) {}

  /**
   * Tüm aktif avatar'ları getir (Mobile API için)
   */
  async getActiveAvatars(): Promise<Avatar[]> {
    return this.avatarRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Tüm avatar'ları getir (Admin için)
   */
  async getAllAvatars(): Promise<Avatar[]> {
    return this.avatarRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Avatar oluştur
   */
  async createAvatar(createAvatarDto: CreateAvatarDto): Promise<Avatar> {
    const avatar = this.avatarRepository.create({
      ...createAvatarDto,
      isActive: createAvatarDto.isActive ?? true,
    });

    return this.avatarRepository.save(avatar);
  }

  /**
   * Avatar güncelle
   */
  async updateAvatar(
    id: string,
    updateAvatarDto: UpdateAvatarDto,
  ): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { id },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    Object.assign(avatar, updateAvatarDto);
    return this.avatarRepository.save(avatar);
  }

  /**
   * Avatar sil
   */
  async deleteAvatar(id: string): Promise<void> {
    const avatar = await this.avatarRepository.findOne({
      where: { id },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    await this.avatarRepository.remove(avatar);
  }

  /**
   * Avatar getir (ID ile)
   */
  async getAvatarById(id: string): Promise<Avatar> {
    const avatar = await this.avatarRepository.findOne({
      where: { id },
    });

    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }

    return avatar;
  }
}
