import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Session } from '../../modules/sessions/entities/session.entity';

export const ActiveSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Session => {
    const request = context.switchToHttp().getRequest<{ session: Session }>();
    return request.session;
  },
);
