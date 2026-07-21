import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { open as openFile, stat } from 'node:fs/promises';
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

  async inspect(objectKey: string) {
    const filePath = this.resolveObjectKey(objectKey);
    let fileSize: number;
    try {
      const details = await stat(filePath);
      if (!details.isFile()) throw new Error('Not a file');
      fileSize = details.size;
      const handle = await openFile(filePath, 'r');
      try {
        const signature = Buffer.alloc(5);
        await handle.read(signature, 0, signature.length, 0);
        if (signature.toString('ascii') !== '%PDF-') {
          throw new BadRequestException('File ebook không phải định dạng PDF');
        }
      } finally {
        await handle.close();
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR' || code === undefined) {
        throw new NotFoundException('File ebook chưa được cấu hình trên máy chủ');
      }
      throw new InternalServerErrorException('Không thể đọc file ebook');
    }
    return { size: fileSize };
  }

  async open(
    objectKey: string,
    range?: { start: number; end?: number },
  ): Promise<StoredBookObject> {
    const filePath = this.resolveObjectKey(objectKey);
    const { size: fileSize } = await this.inspect(objectKey);

    const start = range?.start ?? 0;
    const end = Math.min(range?.end ?? fileSize - 1, fileSize - 1);
    if (start < 0 || start >= fileSize || end < start) {
      throw new HttpException(
        'Khoảng byte PDF không hợp lệ',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    }
    return {
      stream: createReadStream(filePath, { start, end }),
      size: fileSize,
      start,
      end,
      contentLength: end - start + 1,
    };
  }

  private resolveObjectKey(objectKey: string) {
    const normalizedKey = objectKey.replaceAll('\\', '/').replace(/^\/+/, '');
    const filePath = resolve(this.root, normalizedKey);
    const fromRoot = relative(this.root, filePath);
    if (!normalizedKey || fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
      throw new BadRequestException('Đường dẫn ebook không hợp lệ');
    }
    return filePath;
  }
}
