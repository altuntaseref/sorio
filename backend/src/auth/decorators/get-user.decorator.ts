import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * @description
 * Custom decorator to extract the user object from the request.
 * This decorator should be used in routes protected by JwtAuthGuard.
 * It assumes that JwtAuthGuard attaches the user entity to the request object.
 */
export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
