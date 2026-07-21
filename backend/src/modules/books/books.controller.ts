import { Controller, Get, Param } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll() {
    return this.books.findAllPublic();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.books.findOnePublic(id);
  }
}
