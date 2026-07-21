import type { ReadStream } from 'node:fs';

export const BOOK_STORAGE = Symbol('BOOK_STORAGE');

export type StoredBookObject = {
  stream: ReadStream;
  size: number;
  start: number;
  end: number;
  contentLength: number;
};

export interface BookStorage {
  open(objectKey: string, range?: { start: number; end?: number }): Promise<StoredBookObject>;
}
