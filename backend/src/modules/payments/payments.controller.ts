import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Webhook } from '@payos/node/lib/resources/webhooks/webhook';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments/payos')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.payments.create(dto, user);
  }

  @Post('demo')
  @UseGuards(JwtAuthGuard)
  demo(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.payments.demoPurchase(dto, user);
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() payload: Webhook) {
    return this.payments.verifyWebhook(payload);
  }

  @Post(':orderCode/demo-confirm')
  @UseGuards(JwtAuthGuard)
  demoConfirm(
    @Param('orderCode') orderCode: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.demoConfirm(Number(orderCode), user);
  }

  @Get(':orderCode')
  @UseGuards(JwtAuthGuard)
  status(@Param('orderCode') orderCode: string, @CurrentUser() user: AuthUser) {
    return this.payments.status(Number(orderCode), user);
  }
}
