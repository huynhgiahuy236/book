import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from '../books/books.module';
import { LibraryModule } from '../library/library.module';
import { Order, OrderSchema } from './schemas/order.schema';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { GiftsModule } from '../gifts/gifts.module';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    LibraryModule,
    GiftsModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
