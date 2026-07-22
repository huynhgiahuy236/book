import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Order, OrderSchema } from '../payments/schemas/order.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StorageModule } from '../storage/storage.module';
import { CloudinaryCoverService } from './cloudinary-cover.service';
import { GiftsModule } from '../gifts/gifts.module';
import {
  ReadingRight,
  ReadingRightSchema,
} from '../library/schemas/reading-right.schema';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    GiftsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ReadingRight.name, schema: ReadingRightSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, CloudinaryCoverService],
})
export class AdminModule {}
