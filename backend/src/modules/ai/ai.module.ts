import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from '../books/books.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({ imports: [AuthModule, BooksModule], controllers: [AiController], providers: [AiService] })
export class AiModule {}
