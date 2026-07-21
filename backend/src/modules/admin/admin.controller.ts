import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('dashboard') dashboard() {
    return this.admin.dashboard();
  }
  @Get('books') books() {
    return this.admin.listBooks();
  }
  @Patch('books/:id') updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateAdminBookDto,
  ) {
    return this.admin.updateBook(id, dto);
  }
  @Delete('books/:id') archiveBook(@Param('id') id: string) {
    return this.admin.archiveBook(id);
  }
}
