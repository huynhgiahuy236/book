import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Book } from '../books/schemas/book.schema';
import { Order } from '../payments/schemas/order.schema';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';
import { BOOK_STORAGE, type BookStorage } from '../storage/book-storage.types';
import { CreatePdfDraftDto, LinkPdfDto } from './dto/pdf-library.dto';
import { CloudinaryCoverService } from './cloudinary-cover.service';
import { GiftsService } from '../gifts/gifts.service';
import { ReadingRight } from '../library/schemas/reading-right.schema';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(ReadingRight.name)
    private readonly rights: Model<ReadingRight>,
    @Inject(BOOK_STORAGE) private readonly storage: BookStorage,
    private readonly config: ConfigService,
    private readonly covers: CloudinaryCoverService,
    private readonly gifts: GiftsService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const objects = await this.storage.listPdfs('ebooks/');
      for (const object of objects) {
        if (
          await this.books.exists({ 'ebookFile.objectKey': object.objectKey })
        )
          continue;
        const slug = this.slugify(object.fileName.replace(/\.pdf$/i, ''));
        const existing = await this.books.findOne({
          $or: [{ id: slug }, { slug }],
        });
        if (existing) {
          await this.linkPdf(existing.id, { objectKey: object.objectKey });
        } else {
          await this.createPdfDraft({ objectKey: object.objectKey, slug });
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Không thể đồng bộ R2 lúc khởi động: ${reason}`);
    }
  }

  async dashboard() {
    const [
      users,
      books,
      orders,
      revenue,
      recentOrders,
      readingRights,
      r2Files,
      lowGifts,
    ] = await Promise.all([
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
      this.rights.countDocuments({ status: 'ACTIVE' }),
      this.storage.listPdfs('ebooks/'),
      this.gifts.list({ page: 1, limit: 50, status: 'ACTIVE' }),
    ]);
    return {
      users,
      books,
      orders,
      revenue: revenue[0]?.total ?? 0,
      recentOrders,
      readingRights,
      r2Files: r2Files.length,
      lowStockGifts: lowGifts.items.filter(
        (gift) =>
          gift.type === 'PHYSICAL' && gift.stock <= gift.lowStockThreshold,
      ).length,
    };
  }

  async listBooks() {
    const books = await this.books.find().sort({ updatedAt: -1 }).lean();
    return books.map((book) => this.toAdminBook(book));
  }

  async updateBook(id: string, dto: UpdateAdminBookDto) {
    const updates: Record<string, unknown> = { ...dto };
    if (dto.hasGift) {
      if (!dto.giftId) throw new BadRequestException('Hãy chọn quà tặng');
      await this.gifts.requireActive(dto.giftId);
    } else if (dto.hasGift === false) {
      updates.giftId = null;
    }
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

  async uploadCover(
    id: string,
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn ảnh bìa');
    const maxBytes =
      this.config.get<number>('MAX_IMAGE_SIZE_MB', 8) * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes)
      throw new BadRequestException('Ảnh bìa vượt giới hạn dung lượng');
    const signatures: Record<string, string[]> = {
      'image/jpeg': ['ffd8ff'],
      'image/png': ['89504e47'],
      'image/webp': ['52494646'],
    };
    const expected = signatures[file.mimetype.toLowerCase()];
    const signature = file.buffer.subarray(0, 4).toString('hex');
    if (!expected?.some((prefix) => signature.startsWith(prefix)))
      throw new BadRequestException('Chỉ nhận ảnh JPG, PNG hoặc WebP hợp lệ');
    const book = await this.books.findOne({ $or: [{ id }, { slug: id }] });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    const previousId = book.coverPublicId;
    const uploaded = await this.covers.upload(file.buffer, book.slug);
    book.coverUrl = uploaded.secure_url;
    book.coverPublicId = uploaded.public_id;
    try {
      await book.save();
    } catch (error) {
      await this.covers.delete(uploaded.public_id).catch(() => undefined);
      throw error;
    }
    await this.covers.delete(previousId).catch(() => undefined);
    return { success: true, coverUrl: book.coverUrl };
  }

  async uploadGiftImage(
    id: string,
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (
      !file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    )
      throw new BadRequestException('Vui lòng chọn ảnh JPG, PNG hoặc WebP');
    const gift = await this.gifts.requireActive(id);
    const uploaded = await this.covers.upload(file.buffer, `gift-${gift.slug}`);
    return this.gifts.setImage(id, uploaded.secure_url, uploaded.public_id);
  }

  async publishBook(id: string) {
    const book = await this.books.findOne({ $or: [{ id }, { slug: id }] });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    const missing = [
      !book.title?.trim() && 'tiêu đề',
      !book.authors?.length && 'tác giả',
      !book.categories?.length && 'thể loại',
      !book.description?.trim() && 'mô tả',
      !book.coverUrl?.trim() && 'ảnh bìa',
      !book.ebookFile || book.ebookFile.status !== 'READY'
        ? 'PDF R2 sẵn sàng'
        : '',
    ].filter(Boolean);
    if (missing.length)
      throw new BadRequestException(`Chưa đủ thông tin: ${missing.join(', ')}`);
    await this.storage.inspect(book.ebookFile!.objectKey);
    book.status = 'ACTIVE';
    book.readingEnabled = true;
    await book.save();
    return { success: true, bookId: book.id, status: 'ACTIVE' };
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

  async pdfLibrary() {
    const [objects, books] = await Promise.all([
      this.storage.listPdfs('ebooks/'),
      this.books
        .find()
        .select('id slug title coverUrl status readingEnabled ebookFile')
        .lean(),
    ]);
    const objectKeys = new Set(objects.map((object) => object.objectKey));
    const items = objects.map((object) => {
      const linked = books.filter(
        (book) => book.ebookFile?.objectKey === object.objectKey,
      );
      const normalizedName = this.slugify(
        object.fileName.replace(/\.pdf$/i, ''),
      );
      const candidates = books.filter(
        (book) =>
          normalizedName === book.slug || normalizedName.includes(book.slug),
      );
      const state =
        linked.length > 1
          ? 'DUPLICATE'
          : linked.length === 1
            ? 'LINKED'
            : candidates.length > 1
              ? 'CONFLICT'
              : 'UNLINKED';
      return {
        ...object,
        state,
        linkedBook: linked[0]
          ? {
              id: linked[0].id,
              slug: linked[0].slug,
              title: linked[0].title,
              coverUrl: linked[0].coverUrl,
            }
          : null,
        candidateBooks: candidates.slice(0, 5).map((book) => ({
          id: book.id,
          slug: book.slug,
          title: book.title,
          coverUrl: book.coverUrl,
        })),
      };
    });
    const missingFiles = books
      .filter(
        (book) =>
          book.ebookFile?.objectKey &&
          !objectKeys.has(book.ebookFile.objectKey),
      )
      .map((book) => ({
        state: 'MISSING_FILE' as const,
        book: { id: book.id, slug: book.slug, title: book.title },
      }));
    return {
      summary: {
        total: objects.length,
        linked: items.filter((item) => item.state === 'LINKED').length,
        unlinked: items.filter((item) => item.state === 'UNLINKED').length,
        missing: missingFiles.length,
        conflicts: items.filter((item) =>
          ['CONFLICT', 'DUPLICATE'].includes(item.state),
        ).length,
      },
      items,
      missingFiles,
      books: books.map((book) => ({
        id: book.id,
        slug: book.slug,
        title: book.title,
        coverUrl: book.coverUrl,
        hasPdf: Boolean(book.ebookFile),
      })),
    };
  }

  async linkPdf(bookId: string, dto: LinkPdfDto) {
    const object = await this.findPdfObject(dto.objectKey);
    const book = await this.books.findOne({
      $or: [{ id: bookId }, { slug: bookId }],
    });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    const usedBy = await this.books.exists({
      _id: { $ne: book._id },
      'ebookFile.objectKey': object.objectKey,
    });
    if (usedBy)
      throw new ConflictException('PDF này đã được liên kết với sách khác');
    if (
      book.ebookFile?.objectKey &&
      book.ebookFile.objectKey !== object.objectKey &&
      !dto.replaceExisting
    ) {
      throw new ConflictException(
        'Sách đã có PDF; cần xác nhận thay thế liên kết',
      );
    }
    await this.books.updateOne(
      { _id: book._id },
      {
        $set: {
          ebookFile: {
            originalFileName: object.fileName,
            objectKey: object.objectKey,
            storageProvider: 'R2',
            mimeType: 'application/pdf',
            fileSize: object.size,
            uploadedAt: object.lastModified ?? undefined,
            availabilityCheckedAt: new Date(),
            status: 'READY',
          },
          readingEnabled: true,
        },
      },
    );
    return { success: true, bookId: book.id, status: 'LINKED' };
  }

  async createPdfDraft(dto: CreatePdfDraftDto) {
    const object = await this.findPdfObject(dto.objectKey);
    if (await this.books.exists({ 'ebookFile.objectKey': object.objectKey })) {
      throw new ConflictException('PDF này đã được liên kết');
    }
    const baseName = object.fileName.replace(/\.pdf$/i, '');
    const slug = dto.slug ?? this.slugify(baseName);
    if (!slug || (await this.books.exists({ $or: [{ id: slug }, { slug }] }))) {
      throw new ConflictException('Slug sách đã tồn tại hoặc không hợp lệ');
    }
    const title = dto.title?.trim() || baseName.replace(/[-_]+/g, ' ').trim();
    const now = new Date();
    const book = await this.books.create({
      id: slug,
      slug,
      externalId: `R2-DRAFT-${slug}`,
      source: 'R2_ADMIN_DRAFT',
      sourceUrl: 'internal:r2-admin-draft',
      title,
      subtitle: '',
      authors: [],
      publisher: '',
      description: '',
      giftDescription: '',
      hasGift: false,
      giftId: null,
      language: 'vie',
      categories: [],
      coverUrl: '',
      previewUrl: '',
      format: 'EBOOK',
      accessType: 'PURCHASE',
      status: 'DRAFT',
      readingEnabled: true,
      premium: false,
      price: 0,
      ebookPrice: 0,
      physicalPrice: 0,
      stock: 0,
      pricingNote: 'ADMIN_MUST_REVIEW',
      importedAt: now.toISOString(),
      ebookFile: {
        originalFileName: object.fileName,
        objectKey: object.objectKey,
        storageProvider: 'R2',
        mimeType: 'application/pdf',
        fileSize: object.size,
        uploadedAt: object.lastModified ?? undefined,
        availabilityCheckedAt: new Date(),
        status: 'READY',
      },
    });
    return { success: true, bookId: book.id, slug: book.slug, status: 'DRAFT' };
  }

  async unlinkPdf(bookId: string) {
    const book = await this.books.findOneAndUpdate(
      { $or: [{ id: bookId }, { slug: bookId }] },
      { $set: { ebookFile: null, readingEnabled: false } },
      { new: true },
    );
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return { success: true, bookId: book.id, status: 'UNLINKED' };
  }

  private async findPdfObject(objectKey: string) {
    const object = (await this.storage.listPdfs('ebooks/')).find(
      (item) => item.objectKey === objectKey,
    );
    if (!object) throw new NotFoundException('Không tìm thấy PDF trong R2');
    return object;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

    const objectKey = `ebooks/${safeSlug}.pdf`;
    const previousKey = book.ebookFile?.objectKey;
    const uploaded = await this.storage.uploadPdf(objectKey, file.buffer);
    book.ebookFile = {
      originalFileName: file.originalname.slice(0, 255),
      objectKey,
      storageProvider: 'R2',
      mimeType: 'application/pdf',
      fileSize: uploaded.size,
      uploadedAt: uploaded.uploadedAt,
      availabilityCheckedAt: uploaded.uploadedAt,
      status: 'READY',
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
            availabilityCheckedAt: ebookFile.availabilityCheckedAt,
            status: ebookFile.status,
          }
        : null,
    };
  }
}
