import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './schemas/book.schema';
import { BOOKS } from './books.data';

@Injectable()
export class BooksService implements OnModuleInit {
  constructor(@InjectModel(Book.name) private readonly books: Model<Book>) {}

  async onModuleInit() {
    await this.books.bulkWrite(
      BOOKS.map((book) => ({
        updateOne: {
          filter: { id: book.id },
          update: { $set: book },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async findAll() {
    return this.books.find().sort({ createdAt: 1 }).lean();
  }

  async findOne(id: string) {
    const book = await this.books.findOne({ id }).lean();
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
}
