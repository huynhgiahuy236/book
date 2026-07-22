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
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GiftDto, ListGiftDto } from './dto/gift.dto';
import { GiftsService } from './gifts.service';

@Controller('admin/gifts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}
  @Get() list(@Query() query: ListGiftDto) {
    return this.gifts.list(query);
  }
  @Get('active') active() {
    return this.gifts.active();
  }
  @Post() create(@Body() dto: GiftDto) {
    return this.gifts.create(dto);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: GiftDto) {
    return this.gifts.update(id, dto);
  }
}
