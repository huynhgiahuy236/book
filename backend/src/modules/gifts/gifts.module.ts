import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { Gift, GiftSchema } from './schemas/gift.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Gift.name, schema: GiftSchema }]),
  ],
  controllers: [GiftsController],
  providers: [GiftsService],
  exports: [GiftsService, MongooseModule],
})
export class GiftsModule {}
