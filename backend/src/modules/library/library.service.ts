import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
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
import { PremiumService } from '../premium/premium.service';

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
    private readonly premium: PremiumService,
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
          update: {
            $set: { status: 'ACTIVE' },
            $setOnInsert: {
              userId,
              bookId,
              source,
              orderCode,
              grantedAt: new Date(),
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async hasRight(userId: string, bookId: string) {
    return Boolean(
      await this.rights.exists({
        userId,
        bookId,
        status: { $ne: 'REVOKED' },
      }),
    );
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
      .find({ userId: user.sub, status: { $ne: 'REVOKED' } })
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

  async access(user: AuthUser, bookId: string) {
    const book = await this.books.findOne(bookId);
    const premiumAccess =
      book.accessType === 'PREMIUM' && (await this.premium.hasActive(user.sub));
    const right =
      user.role === 'ADMIN' || book.accessType === 'FREE' || premiumAccess
        ? null
        : await this.rights
            .findOne({
              userId: user.sub,
              bookId: book.id,
              status: { $ne: 'REVOKED' },
            })
            .lean();
    const source =
      user.role === 'ADMIN'
        ? 'ADMIN'
        : book.accessType === 'FREE'
          ? 'FREE'
          : premiumAccess
            ? 'PREMIUM'
            : right?.source;
    const progress = await this.progress
      .findOne({ userId: user.sub, bookId: book.id })
      .lean();
    const hasAccess = Boolean(source);
    return {
      bookId: book.id,
      owned: user.role === 'ADMIN' || Boolean(right),
      canRead: hasAccess && book.readingEnabled && Boolean(book.ebookFile),
      source,
      readingEnabled: book.readingEnabled,
      hasReadableContent: Boolean(book.ebookFile),
      progress: progress ?? {
        currentPage: 1,
        totalPages: 0,
        progressPercentage: 0,
      },
    };
  }

  async read(user: AuthUser, bookId: string) {
    const book = await this.books.findOne(bookId);
    await this.assertRight(user, book);
    if (!book.readingEnabled || !book.ebookFile) {
      throw new ForbiddenException('Cuốn sách này chưa bật chế độ đọc online');
    }
    this.assertPdfMime(book.ebookFile.mimeType);
    await this.storage.inspect(book.ebookFile.objectKey);
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
    this.assertPdfMime(book.ebookFile.mimeType);
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
    const previous = await this.progress
      .findOne({ userId: user.sub, bookId: book.id })
      .select('progressPercentage lastReadAt completedAt')
      .lean();
    const completionEligible = Boolean(
      percentage === 100 &&
      previous &&
      previous.progressPercentage >= 95 &&
      previous.lastReadAt.getTime() <= Date.now() - 10_000,
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
            completedAt:
              previous?.completedAt ?? (completionEligible ? new Date() : null),
          },
        },
        { upsert: true, new: true },
      )
      .lean();
  }

  private async assertRight(user: AuthUser, book: ReadableBook) {
    if (user.role === 'ADMIN' || book.accessType === 'FREE') return;
    if (
      book.accessType === 'PREMIUM' &&
      (await this.premium.hasActive(user.sub))
    )
      return;
    if (!(await this.hasRight(user.sub, book.id))) {
      throw new ForbiddenException('Bạn chưa sở hữu quyền đọc cuốn sách này');
    }
  }

  private parseRange(value: string) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(value.trim());
    if (!match)
      throw new HttpException(
        'Header Range không hợp lệ',
        HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
      );
    return {
      start: Number(match[1]),
      end: match[2] ? Number(match[2]) : undefined,
    };
  }

  private assertPdfMime(mimeType?: string) {
    if (mimeType?.toLowerCase() !== 'application/pdf') {
      throw new BadRequestException('Nội dung ebook không phải định dạng PDF');
    }
  }

  private maskEmail(email: string) {
    const [local = '', domain = ''] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
}
