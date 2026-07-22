import { Module } from '@nestjs/common';
import { BOOK_STORAGE } from './book-storage.types';
import { R2BookStorageProvider } from './r2-book-storage.provider';

@Module({
  providers: [
    R2BookStorageProvider,
    { provide: BOOK_STORAGE, useExisting: R2BookStorageProvider },
  ],
  exports: [BOOK_STORAGE],
})
export class StorageModule {}
