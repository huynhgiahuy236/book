import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../payments/schemas/order.schema';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReturnRequest } from './schemas/return-request.schema';
@Injectable()
export class ReturnsService {
  constructor(
    @InjectModel(ReturnRequest.name)
    private readonly returns: Model<ReturnRequest>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
  ) {}
  async create(userId: string, orderCode: number, dto: CreateReturnDto) {
    const order = await this.orders.findOne({ orderCode, userId });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');
    if (!['PAID', 'PROCESSING', 'SHIPPING', 'COMPLETED'].includes(order.status))
      throw new BadRequestException('Đơn hàng không đủ điều kiện đổi trả');
    if (await this.returns.exists({ orderCode, userId }))
      throw new ConflictException('Bạn đã gửi yêu cầu cho đơn hàng này');
    return this.returns.create({
      orderCode,
      userId,
      reason: dto.reason.trim(),
      evidenceUrls: dto.evidenceUrls ?? [],
    });
  }
  mine(userId: string) {
    return this.returns.find({ userId }).sort({ createdAt: -1 }).lean();
  }
}
