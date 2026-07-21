import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { RateLimitService } from '../auth/rate-limit.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly limiter: RateLimitService,
  ) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  chat(@Body() dto: ChatDto, @CurrentUser() user: AuthUser) {
    this.limiter.hit('ai', user.sub, 15, 60_000);
    return this.ai.chat(dto.message);
  }
}
