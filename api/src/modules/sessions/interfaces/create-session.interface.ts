import { RequestMetadata } from '../../../common/types/request-metadata.interface';

export interface CreateSessionData {
  userId: string;
  hash: string;
  metadata?: RequestMetadata;
}
