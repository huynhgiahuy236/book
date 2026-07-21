import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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
    return this.library.read(user.sub, bookId);
  }

  @Patch(':bookId/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.library.saveProgress(user.sub, bookId, dto);
  }
}
