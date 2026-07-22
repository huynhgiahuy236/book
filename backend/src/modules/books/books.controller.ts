import { Controller, Get, Param, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { ListBooksDto } from './dto/list-books.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  findAll(@Query() query: ListBooksDto) {
    return this.books.findAllPublic(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.books.findOnePublic(id);
  }
}
