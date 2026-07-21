import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from '../books/books.module';
import { LibraryModule } from '../library/library.module';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Review, ReviewSchema } from './schemas/review.schema';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    LibraryModule,
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
