import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PremiumPlanDto } from '../premium/dto/premium.dto';
import { PremiumService } from '../premium/premium.service';
import {
  AdminListDto,
  RightActionDto,
  StatusActionDto,
  UserStatusDto,
} from './dto/admin-ops.dto';
import { AdminOpsService } from './admin-ops.service';
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminOpsController {
  constructor(
    private readonly ops: AdminOpsService,
    private readonly premium: PremiumService,
  ) {}
  @Get('orders') orders(@Query() dto: AdminListDto) {
    return this.ops.ordersList(dto);
  }
  @Patch('orders/:code/status') orderStatus(
    @Param('code') code: string,
    @Body() dto: StatusActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.orderStatus(Number(code), dto, user);
  }
  @Get('users') users(@Query() dto: AdminListDto) {
    return this.ops.usersList(dto);
  }
  @Patch('users/:id/status') userStatus(
    @Param('id') id: string,
    @Body() dto: UserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.userStatus(id, dto, user);
  }
  @Get('rights') rights(@Query() dto: AdminListDto) {
    return this.ops.rightsList(dto);
  }
  @Post('rights') grant(
    @Body() dto: RightActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.grantRight(dto, user);
  }
  @Patch('rights/:id/revoke') revoke(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.revokeRight(id, reason, user);
  }
  @Get('progress') progress(@Query() dto: AdminListDto) {
    return this.ops.progressList(dto);
  }
  @Get('reviews') reviews(@Query() dto: AdminListDto) {
    return this.ops.reviewsList(dto);
  }
  @Patch('reviews/:id/status') reviewStatus(
    @Param('id') id: string,
    @Body() dto: StatusActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.reviewStatus(id, dto, user);
  }
  @Get('returns') returns(@Query() dto: AdminListDto) {
    return this.ops.returnsList(dto);
  }
  @Patch('returns/:id/status') returnStatus(
    @Param('id') id: string,
    @Body() dto: StatusActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ops.returnStatus(id, dto, user);
  }
  @Get('premium/plans') plans() {
    return this.ops.plans();
  }
  @Post('premium/plans') createPlan(@Body() dto: PremiumPlanDto) {
    return this.premium.createPlan(dto);
  }
  @Patch('premium/plans/:id') updatePlan(
    @Param('id') id: string,
    @Body() dto: PremiumPlanDto,
  ) {
    return this.premium.updatePlan(id, dto);
  }
  @Get('premium/subscriptions') subscriptions() {
    return this.ops.subscriptions();
  }
  @Get('audit-logs') audit(@Query() dto: AdminListDto) {
    return this.ops.auditLogs(dto);
  }
  @Get('analytics') analytics(@Query('days') days?: string) {
    return this.ops.analytics(Math.min(90, Math.max(7, Number(days) || 30)));
  }
}
