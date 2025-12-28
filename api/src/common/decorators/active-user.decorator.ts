import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../modules/users/entities/user.entity';

export const ActiveUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
