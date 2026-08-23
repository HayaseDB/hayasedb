import { Global, Module } from '@nestjs/common'
import { LocalStorageController } from './local-storage.controller'
import { STORAGE } from './storage.constants'
import { StorageLifecycle, storageProvider } from './storage.providers'

@Global()
@Module({
  controllers: [LocalStorageController],
  providers: [storageProvider, StorageLifecycle],
  exports: [STORAGE],
})
export class StorageModule {}
