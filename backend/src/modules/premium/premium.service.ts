import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PremiumPlanDto } from './dto/premium.dto';
import { PremiumPlan } from './schemas/premium-plan.schema';
import { PremiumSubscription } from './schemas/premium-subscription.schema';
@Injectable()
export class PremiumService {
  constructor(
    @InjectModel(PremiumPlan.name) private readonly plans: Model<PremiumPlan>,
    @InjectModel(PremiumSubscription.name)
    private readonly subscriptions: Model<PremiumSubscription>,
  ) {}
  listPlans() {
    return this.plans.find().sort({ price: 1 }).lean();
  }
  async createPlan(dto: PremiumPlanDto) {
    if (await this.plans.exists({ slug: dto.slug }))
      throw new ConflictException('Slug gói Premium đã tồn tại');
    return this.plans.create(dto);
  }
  async updatePlan(id: string, dto: PremiumPlanDto) {
    const plan = await this.plans.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Không tìm thấy gói Premium');
    return plan;
  }
  listSubscriptions() {
    return this.subscriptions.find().sort({ createdAt: -1 }).limit(200).lean();
  }
  async hasActive(userId: string) {
    return Boolean(
      await this.subscriptions.exists({
        userId,
        status: 'ACTIVE',
        endsAt: { $gt: new Date() },
      }),
    );
  }
}
