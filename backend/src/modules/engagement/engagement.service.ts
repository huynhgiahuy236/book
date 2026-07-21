import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AuthUser } from '../auth/types/auth-user.type';
import { BooksService } from '../books/books.service';
import { LibraryService } from '../library/library.service';
import { ReviewDto } from './dto/review.dto';
import { Favorite } from './schemas/favorite.schema';
import { Review } from './schemas/review.schema';

@Injectable()
export class EngagementService {
  constructor(
    @InjectModel(Favorite.name) private readonly favorites: Model<Favorite>,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    private readonly books: BooksService,
    private readonly library: LibraryService,
  ) {}

  async listFavorites(userId: string) {
    return this.favorites
      .find({ userId })
      .sort({ createdAt: -1 })
      .select('bookId createdAt')
      .lean();
  }

  async addFavorite(userId: string, bookId: string) {
    await this.books.findOne(bookId);
    await this.favorites.updateOne(
      { userId, bookId },
      { $setOnInsert: { userId, bookId } },
      { upsert: true },
    );
    return { success: true, bookId };
  }

  async removeFavorite(userId: string, bookId: string) {
    await this.favorites.deleteOne({ userId, bookId });
    return { success: true, bookId };
  }

  listReviews(bookId: string) {
    return this.reviews
      .find({ bookId, status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .select('authorName rating content createdAt')
      .lean();
  }

  async createReview(user: AuthUser, bookId: string, dto: ReviewDto) {
    await this.books.findOne(bookId);
    if (
      user.role !== 'ADMIN' &&
      !(await this.library.hasRight(user.sub, bookId))
    )
      throw new ForbiddenException('Bạn cần sở hữu sách trước khi đánh giá');
    if (await this.reviews.exists({ userId: user.sub, bookId }))
      throw new ConflictException('Bạn đã đánh giá cuốn sách này');
    const review = await this.reviews.create({
      userId: user.sub,
      bookId,
      authorName: user.name,
      rating: dto.rating,
      content: dto.content.trim(),
    });
    await this.refreshRating(bookId);
    return review;
  }

  async updateReview(user: AuthUser, bookId: string, dto: ReviewDto) {
    const review = await this.reviews.findOneAndUpdate(
      { userId: user.sub, bookId },
      { $set: { rating: dto.rating, content: dto.content.trim() } },
      { new: true },
    );
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá của bạn');
    await this.refreshRating(bookId);
    return review;
  }

  async deleteReview(userId: string, bookId: string) {
    const result = await this.reviews.deleteOne({ userId, bookId });
    if (!result.deletedCount)
      throw new NotFoundException('Không tìm thấy đánh giá của bạn');
    await this.refreshRating(bookId);
    return { success: true };
  }

  private async refreshRating(bookId: string) {
    const values = await this.reviews.aggregate<{
      average: number;
      count: number;
    }>([
      { $match: { bookId, status: 'PUBLISHED' } },
      {
        $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } },
      },
    ]);
    await this.books.updateRating(
      bookId,
      values[0]?.average ?? null,
      values[0]?.count ?? 0,
    );
  }
}
