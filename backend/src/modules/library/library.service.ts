import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AuthUser } from '../auth/types/auth-user.type';
import { BooksService } from '../books/books.service';
import { BOOK_STORAGE, type BookStorage } from '../storage/book-storage.types';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ReadingProgress } from './schemas/reading-progress.schema';
import { ReadingRight } from './schemas/reading-right.schema';

type ReadableBook = Awaited<ReturnType<BooksService['findOne']>>;

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(ReadingRight.name)
    private readonly rights: Model<ReadingRight>,
    @InjectModel(ReadingProgress.name)
    private readonly progress: Model<ReadingProgress>,
    private readonly books: BooksService,
    @Inject(BOOK_STORAGE) private readonly storage: BookStorage,
  ) {}

  async grant(
    userId: string,
    bookIds: string[],
    source: 'PURCHASE' | 'DEMO',
    orderCode?: number,
  ) {
    await this.rights.bulkWrite(
      bookIds.map((bookId) => ({
        updateOne: {
          filter: { userId, bookId },
          update: { $setOnInsert: { userId, bookId, source, orderCode } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async hasRight(userId: string, bookId: string) {
    return Boolean(await this.rights.exists({ userId, bookId }));
  }

  async list(user: AuthUser) {
    const progresses = await this.progress.find({ userId: user.sub }).lean();
    if (user.role === 'ADMIN') {
      const books = (await this.books.findAll()).filter(
        (book) => book.readingEnabled && book.ebookFile,
      );
      return books.map((book) => ({
        right: { source: 'ADMIN' as const },
        book: this.books.toPublic(book),
        progress: progresses.find((item) => item.bookId === book.id) ?? {
          currentPage: 1,
          totalPages: 0,
          progressPercentage: 0,
          percent: 0,
        },
      }));
    }
    const rights = await this.rights
      .find({ userId: user.sub })
      .sort({ createdAt: -1 })
      .lean();
    return Promise.all(
      rights.map(async (right) => ({
        right,
        book: this.books.toPublic(await this.books.findOne(right.bookId)),
        progress: progresses.find((item) => item.bookId === right.bookId) ?? {
          currentPage: 1,
          totalPages: 0,
          progressPercentage: 0,
          percent: 0,
        },
      })),
    );
  }

  async read(user: AuthUser, bookId: string) {
    const book = await this.books.findOne(bookId);
    await this.assertRight(user, book);
    if (!book.readingEnabled || !book.ebookFile) {
      throw new ForbiddenException('Cuốn sách này chưa bật chế độ đọc online');
    }
    const progress = await this.progress
      .findOne({ userId: user.sub, bookId: book.id })
      .lean();
    return {
      book: this.books.toPublic(book),
      document: {
        contentUrl: `/library/${encodeURIComponent(book.id)}/content`,
        mimeType: book.ebookFile.mimeType ?? 'application/pdf',
        pageCount: book.ebookFile.pageCount ?? book.pageCount ?? null,
      },
      progress: progress ?? {
        currentPage: 1,
        totalPages: 0,
        progressPercentage: 0,
      },
      watermark: {
        name: user.name,
        maskedEmail: this.maskEmail(user.email),
        shortUserId: user.sub.slice(-8),
        issuedAt: new Date().toISOString(),
      },
    };
  }

  async openContent(user: AuthUser, bookId: string, rangeHeader?: string) {
    const book = await this.books.findOne(bookId);
    await this.assertRight(user, book);
    if (!book.readingEnabled || !book.ebookFile?.objectKey) {
      throw new ForbiddenException('Cuốn sách này chưa có nội dung đọc online');
    }
    const range = rangeHeader ? this.parseRange(rangeHeader) : undefined;
    return {
      object: await this.storage.open(book.ebookFile.objectKey, range),
      partial: Boolean(range),
    };
  }

  async saveProgress(user: AuthUser, bookId: string, dto: UpdateProgressDto) {
    const book = await this.books.findOne(bookId);
    await this.assertRight(user, book);
    const percentage = Math.min(
      100,
      Math.round((dto.currentPage / dto.totalPages) * 100),
    );
    return this.progress
      .findOneAndUpdate(
        { userId: user.sub, bookId: book.id },
        {
          $set: {
            chapter: dto.chapter ?? 0,
            percent: dto.percent ?? percentage,
            currentPage: dto.currentPage,
            totalPages: dto.totalPages,
            progressPercentage: percentage,
            lastReadAt: new Date(),
            completedAt: percentage === 100 ? new Date() : null,
          },
        },
        { upsert: true, new: true },
      )
      .lean();
  }

  private async assertRight(user: AuthUser, book: ReadableBook) {
    if (user.role === 'ADMIN' || book.accessType === 'FREE') return;
    if (!(await this.rights.exists({ userId: user.sub, bookId: book.id }))) {
      throw new ForbiddenException('Bạn chưa sở hữu quyền đọc cuốn sách này');
    }
  }

  private parseRange(value: string) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(value.trim());
    if (!match) throw new BadRequestException('Header Range không hợp lệ');
    return {
      start: Number(match[1]),
      end: match[2] ? Number(match[2]) : undefined,
    };
  }

  private maskEmail(email: string) {
    const [local = '', domain = ''] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
}
