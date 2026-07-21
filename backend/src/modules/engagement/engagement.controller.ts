import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { ReviewDto } from './dto/review.dto';
import { EngagementService } from './engagement.service';

@Controller()
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('favorites') @UseGuards(JwtAuthGuard)
  favorites(@CurrentUser() user: AuthUser) { return this.engagement.listFavorites(user.sub); }
  @Post('favorites/:bookId') @UseGuards(JwtAuthGuard)
  addFavorite(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string) { return this.engagement.addFavorite(user.sub, bookId); }
  @Delete('favorites/:bookId') @UseGuards(JwtAuthGuard)
  removeFavorite(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string) { return this.engagement.removeFavorite(user.sub, bookId); }

  @Get('books/:bookId/reviews')
  reviews(@Param('bookId') bookId: string) { return this.engagement.listReviews(bookId); }
  @Post('books/:bookId/reviews') @UseGuards(JwtAuthGuard)
  createReview(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string, @Body() dto: ReviewDto) { return this.engagement.createReview(user, bookId, dto); }
  @Patch('books/:bookId/reviews/me') @UseGuards(JwtAuthGuard)
  updateReview(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string, @Body() dto: ReviewDto) { return this.engagement.updateReview(user, bookId, dto); }
  @Delete('books/:bookId/reviews/me') @UseGuards(JwtAuthGuard)
  deleteReview(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string) { return this.engagement.deleteReview(user.sub, bookId); }
}
