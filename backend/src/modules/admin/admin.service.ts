import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { Book } from '../books/schemas/book.schema';
import { Order } from '../payments/schemas/order.schema';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Book.name) private readonly books: Model<Book>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
  ) {}

  async dashboard() {
    const [users, books, orders, revenue, recentOrders] = await Promise.all([
      this.users.countDocuments(), this.books.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      this.orders.countDocuments(),
      this.orders.aggregate<{ total: number }>([{ $match: { status: 'PAID' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      this.orders.find().sort({ createdAt: -1 }).limit(8).select('orderCode amount status provider createdAt').lean(),
    ]);
    return { users, books, orders, revenue: revenue[0]?.total ?? 0, recentOrders };
  }

  listBooks() {
    return this.books.find().sort({ updatedAt: -1 }).lean();
  }

  async updateBook(id: string, dto: UpdateAdminBookDto) {
    const updates: Record<string, unknown> = { ...dto };
    if (dto.ebookPrice !== undefined) updates.price = dto.ebookPrice;
    const book = await this.books.findOneAndUpdate({ $or: [{ id }, { slug: id }] }, { $set: updates }, { new: true }).lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return book;
  }

  async archiveBook(id: string) {
    const book = await this.books.findOneAndUpdate({ $or: [{ id }, { slug: id }] }, { $set: { status: 'ARCHIVED', readingEnabled: false } }, { new: true }).lean();
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return { success: true, id: book.id };
  }
}
