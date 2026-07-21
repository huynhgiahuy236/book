import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BooksService } from '../books/books.service';
import { READER_CHAPTERS } from './content/reader-content';
import { ReadingProgress } from './schemas/reading-progress.schema';
import { ReadingRight } from './schemas/reading-right.schema';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(ReadingRight.name)
    private readonly rights: Model<ReadingRight>,
    @InjectModel(ReadingProgress.name)
    private readonly progress: Model<ReadingProgress>,
    private readonly books: BooksService,
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

  async list(userId: string) {
    const rights = await this.rights
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    const progresses = await this.progress.find({ userId }).lean();
    const result = await Promise.all(
      rights.map(async (right) => ({
        right,
        book: await this.books.findOne(right.bookId),
        progress: progresses.find((item) => item.bookId === right.bookId) ?? {
          chapter: 0,
          percent: 0,
        },
      })),
    );
    return result;
  }

  async read(userId: string, bookId: string) {
    await this.assertRight(userId, bookId);
    const [book, progress] = await Promise.all([
      this.books.findOne(bookId),
      this.progress.findOne({ userId, bookId }).lean(),
    ]);
    return {
      book,
      chapters: READER_CHAPTERS,
      progress: progress ?? { chapter: 0, percent: 0 },
    };
  }

  async saveProgress(userId: string, bookId: string, dto: UpdateProgressDto) {
    await this.assertRight(userId, bookId);
    return this.progress
      .findOneAndUpdate(
        { userId, bookId },
        { $set: { chapter: dto.chapter, percent: dto.percent } },
        { upsert: true, new: true },
      )
      .lean();
  }

  private async assertRight(userId: string, bookId: string) {
    if (!(await this.rights.exists({ userId, bookId }))) {
      throw new ForbiddenException('Bạn chưa sở hữu quyền đọc cuốn sách này');
    }
  }
}
