import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AuthUser } from '../auth/types/auth-user.type';
import { User } from '../auth/schemas/user.schema';
import { Order } from '../payments/schemas/order.schema';
import { ReadingRight } from '../library/schemas/reading-right.schema';
import { ReadingProgress } from '../library/schemas/reading-progress.schema';
import { Review } from '../engagement/schemas/review.schema';
import { ReturnRequest } from '../returns/schemas/return-request.schema';
import { AuditService } from '../audit/audit.service';
import { GiftsService } from '../gifts/gifts.service';
import { PremiumService } from '../premium/premium.service';
import {
  AdminListDto,
  RightActionDto,
  StatusActionDto,
  UserStatusDto,
} from './dto/admin-ops.dto';

@Injectable()
export class AdminOpsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(ReadingRight.name)
    private readonly rights: Model<ReadingRight>,
    @InjectModel(ReadingProgress.name)
    private readonly progress: Model<ReadingProgress>,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    @InjectModel(ReturnRequest.name)
    private readonly returns: Model<ReturnRequest>,
    private readonly audit: AuditService,
    private readonly gifts: GiftsService,
    private readonly premium: PremiumService,
  ) {}
  private async page<T>(
    model: Model<T>,
    filter: Record<string, unknown>,
    dto: AdminListDto,
    sort: Record<string, 1 | -1> = { createdAt: -1 },
  ) {
    const [items, totalItems] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip((dto.page - 1) * dto.limit)
        .limit(dto.limit)
        .lean(),
      model.countDocuments(filter),
    ]);
    return {
      items,
      page: dto.page,
      limit: dto.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / dto.limit),
    };
  }
  ordersList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.status) filter.status = dto.status;
    if (dto.query && /^\d+$/.test(dto.query))
      filter.orderCode = Number(dto.query);
    return this.page(this.orders, filter, dto);
  }
  usersList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.status) filter.status = dto.status;
    if (dto.query)
      filter.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { email: { $regex: dto.query, $options: 'i' } },
      ];
    return this.page(this.users, filter, dto);
  }
  rightsList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.status) filter.status = dto.status;
    if (dto.query)
      filter.$or = [
        { userId: dto.query },
        { bookId: { $regex: dto.query, $options: 'i' } },
      ];
    return this.page(this.rights, filter, dto);
  }
  progressList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.query)
      filter.$or = [
        { userId: dto.query },
        { bookId: { $regex: dto.query, $options: 'i' } },
      ];
    return this.page(this.progress, filter, dto, { lastReadAt: -1 });
  }
  reviewsList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.status) filter.status = dto.status;
    if (dto.query)
      filter.$or = [
        { authorName: { $regex: dto.query, $options: 'i' } },
        { content: { $regex: dto.query, $options: 'i' } },
      ];
    return this.page(this.reviews, filter, dto);
  }
  returnsList(dto: AdminListDto) {
    const filter: Record<string, unknown> = {};
    if (dto.status) filter.status = dto.status;
    return this.page(this.returns, filter, dto);
  }
  plans() {
    return this.premium.listPlans();
  }
  subscriptions() {
    return this.premium.listSubscriptions();
  }
  async grantRight(dto: RightActionDto, actor: AuthUser) {
    await this.rights.updateOne(
      { userId: dto.userId, bookId: dto.bookId },
      {
        $set: { status: 'ACTIVE', source: 'MANUAL', reason: dto.reason },
        $setOnInsert: { grantedAt: new Date() },
      },
      { upsert: true },
    );
    await this.audit.record(
      actor,
      'RIGHT_GRANT',
      'ReadingRight',
      `${dto.userId}:${dto.bookId}`,
      { reason: dto.reason },
    );
    return { success: true };
  }
  async revokeRight(id: string, reason: string, actor: AuthUser) {
    const right = await this.rights.findByIdAndUpdate(
      id,
      { $set: { status: 'REVOKED', reason } },
      { new: true },
    );
    if (!right) throw new NotFoundException('Không tìm thấy quyền đọc');
    await this.audit.record(actor, 'RIGHT_REVOKE', 'ReadingRight', id, {
      reason,
    });
    return right;
  }
  async userStatus(id: string, dto: UserStatusDto, actor: AuthUser) {
    const user = await this.users
      .findByIdAndUpdate(id, { $set: { status: dto.status } }, { new: true })
      .select('-passwordHash');
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    await this.audit.record(actor, 'USER_STATUS', 'User', id, {
      status: dto.status,
      reason: dto.reason,
    });
    return user;
  }
  async reviewStatus(id: string, dto: StatusActionDto, actor: AuthUser) {
    if (!['PUBLISHED', 'HIDDEN'].includes(dto.status))
      throw new BadRequestException('Trạng thái đánh giá không hợp lệ');
    const review = await this.reviews.findByIdAndUpdate(
      id,
      { $set: { status: dto.status } },
      { new: true },
    );
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    await this.audit.record(actor, 'REVIEW_MODERATE', 'Review', id, {
      status: dto.status,
      reason: dto.reason,
    });
    return review;
  }
  async orderStatus(orderCode: number, dto: StatusActionDto, actor: AuthUser) {
    if (
      ![
        'PROCESSING',
        'SHIPPING',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED',
      ].includes(dto.status)
    )
      throw new BadRequestException('Trạng thái đơn hàng không hợp lệ');
    const order = await this.orders.findOne({ orderCode });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const giftWasConsumed = [
      'PAID',
      'PROCESSING',
      'SHIPPING',
      'COMPLETED',
    ].includes(order.status);
    if (
      ['CANCELLED', 'REFUNDED'].includes(dto.status) &&
      giftWasConsumed &&
      !order.giftStockRestored
    ) {
      await this.gifts.restorePhysical(order.giftSnapshots ?? []);
      order.giftStockRestored = true;
    }
    order.status = dto.status as Order['status'];
    order.statusHistory.push({
      status: dto.status,
      at: new Date(),
      actorId: actor.sub,
      note: dto.reason,
    });
    await order.save();
    await this.audit.record(actor, 'ORDER_STATUS', 'Order', String(orderCode), {
      status: dto.status,
      reason: dto.reason,
    });
    return order;
  }
  async returnStatus(id: string, dto: StatusActionDto, actor: AuthUser) {
    if (!['APPROVED', 'REJECTED'].includes(dto.status))
      throw new BadRequestException('Trạng thái đổi trả không hợp lệ');
    const request = await this.returns.findById(id);
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu đổi trả');
    request.status = dto.status as 'APPROVED' | 'REJECTED';
    request.adminNote = dto.reason;
    request.resolvedBy = actor.sub;
    request.resolvedAt = new Date();
    await request.save();
    if (dto.status === 'APPROVED')
      await this.orderStatus(
        request.orderCode,
        { status: 'REFUNDED', reason: `Đổi trả: ${dto.reason}` },
        actor,
      );
    await this.audit.record(actor, 'RETURN_RESOLVE', 'ReturnRequest', id, {
      status: dto.status,
      reason: dto.reason,
    });
    return request;
  }
  auditLogs(dto: AdminListDto) {
    return this.audit.list(dto.page, dto.limit);
  }
  async analytics(days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    const [revenue, statuses] = await Promise.all([
      this.orders.aggregate([
        {
          $match: {
            createdAt: { $gte: from },
            status: { $in: ['PAID', 'PROCESSING', 'SHIPPING', 'COMPLETED'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            value: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.orders.aggregate([
        { $group: { _id: '$status', value: { $sum: 1 } } },
      ]),
    ]);
    return { revenue, statuses, days };
  }
}
