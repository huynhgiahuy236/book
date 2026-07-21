import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { BookStorage, StoredBookObject } from './book-storage.types';

@Injectable()
export class LocalBookStorageProvider implements BookStorage {
  private readonly root: string;

  constructor(config: ConfigService) {
    const configured = config.get<string>(
      'BOOK_STORAGE_ROOT',
      'storage/private/ebooks',
    );
    this.root = isAbsolute(configured)
      ? resolve(configured)
      : resolve(process.cwd(), configured);
  }

  async open(
    objectKey: string,
    range?: { start: number; end?: number },
  ): Promise<StoredBookObject> {
    const normalizedKey = objectKey.replaceAll('\\', '/').replace(/^\/+/, '');
    const filePath = resolve(this.root, normalizedKey);
    const fromRoot = relative(this.root, filePath);
    if (!normalizedKey || fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
      throw new BadRequestException('Đường dẫn ebook không hợp lệ');
    }

    let fileSize: number;
    try {
      fileSize = (await stat(filePath)).size;
    } catch {
      throw new NotFoundException('File ebook chưa được cấu hình trên máy chủ');
    }

    const start = range?.start ?? 0;
    const end = Math.min(range?.end ?? fileSize - 1, fileSize - 1);
    if (start < 0 || start >= fileSize || end < start) {
      throw new BadRequestException('Khoảng byte PDF không hợp lệ');
    }
    return {
      stream: createReadStream(filePath, { start, end }),
      size: fileSize,
      start,
      end,
      contentLength: end - start + 1,
    };
  }
}
