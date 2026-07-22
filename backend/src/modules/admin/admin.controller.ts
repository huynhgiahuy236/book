import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UpdateAdminBookDto } from './dto/update-admin-book.dto';
import { CreatePdfDraftDto, LinkPdfDto } from './dto/pdf-library.dto';

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
  @Get('books/:id/pdf-status')
  pdfStatus(@Param('id') id: string) {
    return this.admin.pdfStatus(id);
  }
  @Get('pdf-library')
  pdfLibrary() {
    return this.admin.pdfLibrary();
  }
  @Post('pdf-library/:bookId/link')
  linkPdf(@Param('bookId') bookId: string, @Body() dto: LinkPdfDto) {
    return this.admin.linkPdf(bookId, dto);
  }
  @Post('pdf-library/drafts')
  createPdfDraft(@Body() dto: CreatePdfDraftDto) {
    return this.admin.createPdfDraft(dto);
  }
  @Delete('pdf-library/:bookId/link')
  unlinkPdf(@Param('bookId') bookId: string) {
    return this.admin.unlinkPdf(bookId);
  }
  @Delete('books/:id') archiveBook(@Param('id') id: string) {
    return this.admin.archiveBook(id);
  }

  @Post('books/:id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 12 * 1024 * 1024 },
    }),
  )
  uploadCover(
    @Param('id') id: string,
    @UploadedFile()
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return this.admin.uploadCover(id, file);
  }

  @Post('books/:id/publish')
  publishBook(@Param('id') id: string) {
    return this.admin.publishBook(id);
  }

  @Post('books/:id/pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 100 * 1024 * 1024 },
    }),
  )
  uploadPdf(
    @Param('id') id: string,
    @UploadedFile()
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return this.admin.uploadPdf(id, file);
  }
}
