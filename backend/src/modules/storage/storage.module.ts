import { Module } from '@nestjs/common';
import { BOOK_STORAGE } from './book-storage.types';
import { LocalBookStorageProvider } from './local-book-storage.provider';

@Module({
  providers: [
    LocalBookStorageProvider,
    { provide: BOOK_STORAGE, useExisting: LocalBookStorageProvider },
  ],
  exports: [BOOK_STORAGE],
})
export class StorageModule {}
