import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LibraryService } from './library.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.library.list(user.sub);
  }

  @Get(':bookId/read')
  read(@CurrentUser() user: AuthUser, @Param('bookId') bookId: string) {
    return this.library.read(user, bookId);
  }

  @Get(':bookId/content')
  async content(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const result = await this.library.openContent(
      user,
      bookId,
      request.headers.range,
    );
    response.status(result.partial ? 206 : 200);
    response.set({
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/pdf',
      'Content-Length': String(result.object.contentLength),
      'Content-Disposition': 'inline',
      ...(result.partial
        ? {
            'Content-Range': `bytes ${result.object.start}-${result.object.end}/${result.object.size}`,
          }
        : {}),
    });
    result.object.stream.pipe(response);
  }

  @Patch(':bookId/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.library.saveProgress(user, bookId, dto);
  }
}
