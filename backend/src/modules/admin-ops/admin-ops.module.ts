import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Review, ReviewSchema } from '../engagement/schemas/review.schema';
import { GiftsModule } from '../gifts/gifts.module';
import {
  ReadingProgress,
  ReadingProgressSchema,
} from '../library/schemas/reading-progress.schema';
import {
  ReadingRight,
  ReadingRightSchema,
} from '../library/schemas/reading-right.schema';
import { Order, OrderSchema } from '../payments/schemas/order.schema';
import { PremiumModule } from '../premium/premium.module';
import {
  ReturnRequest,
  ReturnRequestSchema,
} from '../returns/schemas/return-request.schema';
import { AdminOpsController } from './admin-ops.controller';
import { AdminOpsService } from './admin-ops.service';
@Module({
  imports: [
    AuthModule,
    AuditModule,
    GiftsModule,
    PremiumModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ReadingRight.name, schema: ReadingRightSchema },
      { name: ReadingProgress.name, schema: ReadingProgressSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
  ],
  controllers: [AdminOpsController],
  providers: [AdminOpsService],
})
export class AdminOpsModule {}
