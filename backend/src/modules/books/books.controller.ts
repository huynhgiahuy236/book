import { Controller, Get, Param } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll() {
    return this.books.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.books.findOne(id);
  }
}
