import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { RequestMetadata } from '../types/request-metadata.interface';
import { parseRequestMetadata } from '../utils/request-parser.utility';

export const RequestMetadataDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestMetadata => {
    const request = context.switchToHttp().getRequest<Request>();
    return parseRequestMetadata(request);
  },
);
