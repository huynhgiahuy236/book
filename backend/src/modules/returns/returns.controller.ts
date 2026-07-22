import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReturnsService } from './returns.service';
@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returns: ReturnsService) {}
  @Get('me') mine(@CurrentUser() user: AuthUser) {
    return this.returns.mine(user.sub);
  }
  @Post(':orderCode') create(
    @Param('orderCode') code: string,
    @Body() dto: CreateReturnDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.returns.create(user.sub, Number(code), dto);
  }
}
