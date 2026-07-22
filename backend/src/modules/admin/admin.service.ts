import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Book } from '../books/schemas/book.schema';
import { Order } from '../payments/schemas/order.schema';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';
import { BOOK_STORAGE, type BookStorage } from '../storage/book-storage.types';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @Inject(BOOK_STORAGE) private readonly storage: BookStorage,
    private readonly config: ConfigService,
  ) {}

  async dashboard() {
    const [users, books, orders, revenue, recentOrders] = await Promise.all([
      this.users.countDocuments(),
      this.books.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      this.orders.countDocuments(),
      this.orders.aggregate<{ total: number }>([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.orders
        .find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('orderCode amount status provider createdAt')
        .lean(),
    ]);
    return {
      users,
      books,
      orders,
      revenue: revenue[0]?.total ?? 0,
      recentOrders,
    };
  }

  async listBooks() {
    const books = await this.books.find().sort({ updatedAt: -1 }).lean();
    return books.map((book) => this.toAdminBook(book));
  }

  async updateBook(id: string, dto: UpdateAdminBookDto) {
    const updates: Record<string, unknown> = { ...dto };
    if (dto.ebookPrice !== undefined) updates.price = dto.ebookPrice;
    const book = await this.books
      .findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        { $set: updates },
        { new: true },
      )
      .lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return this.toAdminBook(book);
  }

  async archiveBook(id: string) {
    const book = await this.books
      .findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        { $set: { status: 'ARCHIVED', readingEnabled: false } },
        { new: true },
      )
      .lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return { success: true, id: book.id };
  }

  async pdfStatus(id: string) {
    const book = await this.books
      .findOne({ $or: [{ id }, { slug: id }] })
      .select('id readingEnabled ebookFile')
      .lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    if (!book.ebookFile) {
      return { bookId: book.id, status: 'MISSING', readingEnabled: false };
    }
    const metadata = await this.storage.inspect(book.ebookFile.objectKey);
    return {
      bookId: book.id,
      status: book.readingEnabled ? 'READY' : 'DISABLED',
      readingEnabled: book.readingEnabled,
      storageProvider: 'R2',
      fileSize: metadata.size,
      originalFileName: book.ebookFile.originalFileName,
      uploadedAt: book.ebookFile.uploadedAt,
    };
  }

  async uploadPdf(
    id: string,
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn một file PDF');
    const maxBytes =
      this.config.get<number>('MAX_EBOOK_SIZE_MB', 50) * 1024 * 1024;
    if (file.size < 5 || file.size > maxBytes)
      throw new BadRequestException(
        'Dung lượng PDF không hợp lệ hoặc vượt giới hạn',
      );
    if (
      file.mimetype.toLowerCase() !== 'application/pdf' ||
      !file.originalname.toLowerCase().endsWith('.pdf') ||
      file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      throw new BadRequestException('File tải lên phải là PDF hợp lệ');
    }

    const book = await this.books.findOne({ $or: [{ id }, { slug: id }] });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    const safeSlug = book.slug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!safeSlug)
      throw new BadRequestException('Slug sách không hợp lệ để lưu PDF');

    const objectKey = `ebooks/${safeSlug}/${safeSlug}-${Date.now()}.pdf`;
    const previousKey = book.ebookFile?.objectKey;
    const uploaded = await this.storage.uploadPdf(objectKey, file.buffer);
    book.ebookFile = {
      originalFileName: file.originalname.slice(0, 255),
      objectKey,
      storageProvider: 'R2',
      mimeType: 'application/pdf',
      fileSize: uploaded.size,
      uploadedAt: uploaded.uploadedAt,
    };
    book.readingEnabled = true;
    try {
      await book.save();
    } catch (error) {
      await this.storage.delete(objectKey).catch(() => undefined);
      throw error;
    }
    if (previousKey && previousKey !== objectKey) {
      await this.storage.delete(previousKey).catch(() => undefined);
    }
    return {
      success: true,
      bookId: book.id,
      pdf: {
        originalFileName: book.ebookFile.originalFileName,
        fileSize: book.ebookFile.fileSize,
        uploadedAt: book.ebookFile.uploadedAt,
        storageProvider: 'R2',
        status: 'READY',
      },
    };
  }

  private toAdminBook<T extends { ebookFile?: Book['ebookFile'] }>(book: T) {
    const { ebookFile, ...safe } = book;
    return {
      ...safe,
      ebookFile: ebookFile
        ? {
            originalFileName: ebookFile.originalFileName,
            storageProvider: ebookFile.storageProvider,
            mimeType: ebookFile.mimeType,
            fileSize: ebookFile.fileSize,
            pageCount: ebookFile.pageCount,
            uploadedAt: ebookFile.uploadedAt,
          }
        : null,
    };
  }
}
