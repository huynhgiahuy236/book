import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumService } from './premium.service';
import { PremiumPlan, PremiumPlanSchema } from './schemas/premium-plan.schema';
import {
  PremiumSubscription,
  PremiumSubscriptionSchema,
} from './schemas/premium-subscription.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PremiumPlan.name, schema: PremiumPlanSchema },
      { name: PremiumSubscription.name, schema: PremiumSubscriptionSchema },
    ]),
  ],
  providers: [PremiumService],
  exports: [PremiumService, MongooseModule],
})
export class PremiumModule {}
