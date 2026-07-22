import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Order, OrderSchema } from '../payments/schemas/order.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
