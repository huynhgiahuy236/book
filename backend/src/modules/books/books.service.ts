import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './schemas/book.schema';
import { BOOKS } from './books.data';
import { ListBooksDto } from './dto/list-books.dto';

@Injectable()
export class BooksService implements OnModuleInit {
  constructor(@InjectModel(Book.name) private readonly books: Model<Book>) {}

  async onModuleInit() {
    await this.books.bulkWrite(
      BOOKS.map((book) => ({
        updateOne: {
          filter: { id: book.id },
          update: {
            $setOnInsert: {
              ...book,
              slug: book.slug ?? book.id,
              accessType:
                book.accessType ?? (book.premium ? 'PREMIUM' : 'PURCHASE'),
              status: book.status ?? 'ACTIVE',
              readingEnabled: book.readingEnabled ?? false,
              ebookPrice: book.format === 'EBOOK' ? book.price : 0,
              physicalPrice: book.format === 'PHYSICAL' ? book.price : 0,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async findAll() {
    return this.books.find({ status: 'ACTIVE' }).sort({ createdAt: 1 }).lean();
  }

  async findAllPublic(dto: ListBooksDto) {
    const filter: Record<string, unknown> = { status: 'ACTIVE' };
    if (dto.query?.trim()) filter.$text = { $search: dto.query.trim() };
    if (dto.category?.trim()) filter.categories = dto.category.trim();
    const [books, totalItems] = await Promise.all([
      this.books
        .find(filter)
        .sort({ readingEnabled: -1, createdAt: 1 })
        .populate('giftId', 'name description imageUrl type status')
        .lean(),
      this.books.countDocuments(filter),
    ]);
    const ordered = books
      .map((book) => this.toPublic(book))
      .sort(
        (left, right) =>
          Number(right.isReadableOnline) - Number(left.isReadableOnline),
      );
    const start = (dto.page - 1) * dto.limit;
    return {
      items: ordered.slice(start, start + dto.limit),
      page: dto.page,
      limit: dto.limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / dto.limit)),
    };
  }

  async findOnePublic(id: string) {
    const book = await this.books
      .findOne({ status: 'ACTIVE', $or: [{ id }, { slug: id }] })
      .populate('giftId', 'name description imageUrl type status')
      .lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return this.toPublic(book);
  }

  async findOne(id: string) {
    const book = await this.books
      .findOne({ $or: [{ id }, { slug: id }] })
      .lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return book;
  }

  async findMany(ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    const books = await this.books.find({ id: { $in: uniqueIds } }).lean();
    if (books.length !== uniqueIds.length)
      throw new NotFoundException('Một hoặc nhiều sách không tồn tại');
    return uniqueIds.map((id) => books.find((book) => book.id === id)!);
  }

  async updateRating(
    id: string,
    averageRating: number | null,
    ratingsCount: number,
  ) {
    await this.books.updateOne(
      { id },
      { $set: { averageRating, ratingsCount } },
    );
  }

  toPublic<
    T extends {
      ebookFile?: { status?: string } | null;
      readingEnabled?: boolean;
      status?: string;
      hasGift?: boolean;
      giftId?: unknown;
    },
  >(book: T) {
    const { ebookFile, giftId, ...safe } = book;
    const hasReadableContent = ebookFile?.status === 'READY';
    const gift =
      book.hasGift && giftId && typeof giftId === 'object'
        ? (giftId as Record<string, unknown>)
        : null;
    return {
      ...safe,
      gift:
        gift?.status === 'ACTIVE'
          ? {
              name: gift.name,
              description: gift.description,
              imageUrl: gift.imageUrl,
              type: gift.type,
            }
          : null,
      hasReadableContent,
      isReadableOnline:
        hasReadableContent &&
        book.readingEnabled === true &&
        book.status === 'ACTIVE',
    };
  }
}
