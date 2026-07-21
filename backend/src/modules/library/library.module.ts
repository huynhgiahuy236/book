import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from '../books/books.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import {
  ReadingProgress,
  ReadingProgressSchema,
} from './schemas/reading-progress.schema';
import {
  ReadingRight,
  ReadingRightSchema,
} from './schemas/reading-right.schema';

@Module({
  imports: [
    AuthModule,
    BooksModule,
    MongooseModule.forFeature([
      { name: ReadingRight.name, schema: ReadingRightSchema },
      { name: ReadingProgress.name, schema: ReadingProgressSchema },
    ]),
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
