import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReturnRequest,
  ReturnRequestSchema,
} from './schemas/return-request.schema';
import { AuthModule } from '../auth/auth.module';
import { Order, OrderSchema } from '../payments/schemas/order.schema';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [MongooseModule],
})
export class ReturnsModule {}
