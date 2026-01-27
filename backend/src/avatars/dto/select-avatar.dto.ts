import { IsUUID, IsNotEmpty } from 'class-validator';

export class SelectAvatarDto {
  @IsUUID()
  @IsNotEmpty()
  avatarId: string;
}
