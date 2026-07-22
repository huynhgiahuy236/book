import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import type {
  BookStorage,
  BookStorageEntry,
  StoredBookObject,
} from './book-storage.types';

@Injectable()
export class R2BookStorageProvider implements BookStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    const accountId = config.getOrThrow<string>('R2_ACCOUNT_ID');
    const endpoint = config
      .getOrThrow<string>('R2_ENDPOINT')
      .replace(/\/$/, '');
    if (
      new URL(endpoint).hostname !== `${accountId}.r2.cloudflarestorage.com`
    ) {
      throw new Error('R2_ENDPOINT không khớp R2_ACCOUNT_ID');
    }
    this.client = new S3Client({
      region: config.get<string>('R2_REGION', 'auto'),
      endpoint,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async listPdfs(prefix = 'ebooks/'): Promise<BookStorageEntry[]> {
    const safePrefix = this.safeKey(prefix);
    const entries: BookStorageEntry[] = [];
    let continuationToken: string | undefined;
    try {
      do {
        const page = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: safePrefix,
            ContinuationToken: continuationToken,
          }),
        );
        for (const item of page.Contents ?? []) {
          if (!item.Key?.toLowerCase().endsWith('.pdf')) continue;
          entries.push({
            objectKey: item.Key,
            fileName: item.Key.split('/').at(-1) ?? item.Key,
            size: item.Size ?? 0,
            lastModified: item.LastModified ?? null,
          });
        }
        continuationToken = page.IsTruncated
          ? page.NextContinuationToken
          : undefined;
      } while (continuationToken);
      return entries.sort((left, right) =>
        left.objectKey.localeCompare(right.objectKey),
      );
    } catch (error) {
      this.handleStorageError(error, 'Không thể đọc danh sách PDF từ R2');
    }
  }

  async inspect(objectKey: string) {
    const key = this.safeKey(objectKey);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!result.ContentLength)
        throw new NotFoundException('File Ebook không tồn tại');
      return { size: result.ContentLength };
    } catch (error) {
      this.handleStorageError(error, 'Không thể kiểm tra file Ebook trên R2');
    }
  }

  async uploadPdf(objectKey: string, content: Buffer) {
    const key = this.safeKey(objectKey);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: content,
          ContentType: 'application/pdf',
          ContentLength: content.length,
        }),
      );
      return { size: content.length, uploadedAt: new Date() };
    } catch (error) {
      this.handleStorageError(error, 'Không thể tải PDF lên R2');
    }
  }

  async delete(objectKey: string) {
    const key = this.safeKey(objectKey);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      this.handleStorageError(error, 'Không thể xóa file Ebook cũ trên R2');
    }
  }

  async open(
    objectKey: string,
    range?: { start: number; end?: number },
  ): Promise<StoredBookObject> {
    const key = this.safeKey(objectKey);
    const { size } = await this.inspect(key);
    const start = range?.start ?? 0;
    const end = Math.min(range?.end ?? size - 1, size - 1);
    if (start < 0 || start >= size || end < start) {
      throw new HttpException(
        'Khoảng byte PDF không hợp lệ',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    }
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: range ? `bytes=${start}-${end}` : undefined,
        }),
      );
      if (!result.Body) throw new NotFoundException('File Ebook không tồn tại');
      return {
        stream: result.Body as Readable,
        size,
        start,
        end,
        contentLength: result.ContentLength ?? end - start + 1,
      };
    } catch (error) {
      this.handleStorageError(error, 'Không thể đọc file Ebook từ R2');
    }
  }

  private safeKey(value: string) {
    const key = value.replaceAll('\\', '/').replace(/^\/+/, '');
    if (!key || key.includes('..') || key.includes('//')) {
      throw new BadRequestException('Object key Ebook không hợp lệ');
    }
    return key;
  }

  private handleStorageError(error: unknown, fallback: string): never {
    if (error instanceof HttpException) throw error;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404) throw new NotFoundException('File Ebook không tồn tại');
    throw new BadGatewayException(fallback);
  }
}
