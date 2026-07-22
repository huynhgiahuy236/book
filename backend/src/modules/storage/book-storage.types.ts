import type { Readable } from 'node:stream';

export const BOOK_STORAGE = Symbol('BOOK_STORAGE');

export type StoredBookObject = {
  stream: Readable;
  size: number;
  start: number;
  end: number;
  contentLength: number;
};

export type BookStorageEntry = {
  objectKey: string;
  fileName: string;
  size: number;
  lastModified: Date | null;
};

export interface BookStorage {
  listPdfs(prefix?: string): Promise<BookStorageEntry[]>;
  inspect(objectKey: string): Promise<{ size: number }>;
  uploadPdf(
    objectKey: string,
    content: Buffer,
  ): Promise<{ size: number; uploadedAt: Date }>;
  delete(objectKey: string): Promise<void>;
  open(
    objectKey: string,
    range?: { start: number; end?: number },
  ): Promise<StoredBookObject>;
}
