import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum StorageProvider {
  Minio = 'minio',
  Local = 'local',
}

export class StorageConfig {
  @IsEnum(StorageProvider)
  @Transform(({ value }: { value: unknown }) =>
    value ? (value as StorageProvider) : StorageProvider.Minio,
  )
  API_STORAGE_PROVIDER: StorageProvider = StorageProvider.Minio;

  @IsString()
  @IsOptional()
  API_STORAGE_LOCAL_PATH?: string;

  @IsString()
  @IsOptional()
  API_STORAGE_LOCAL_BASE_URL?: string;
}
