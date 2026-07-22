import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true, versionKey: false })
export class PremiumSubscription {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true }) planId!: string;
  @Prop({ required: true }) planName!: string;
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ required: true, index: true }) endsAt!: Date;
  @Prop({
    default: 'ACTIVE',
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    index: true,
  })
  status!: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  @Prop() orderCode?: number;
}
export const PremiumSubscriptionSchema =
  SchemaFactory.createForClass(PremiumSubscription);
PremiumSubscriptionSchema.index({ userId: 1, status: 1 });
