import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true, versionKey: false })
export class PremiumPlan {
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, unique: true, index: true }) slug!: string;
  @Prop({ default: '' }) description!: string;
  @Prop({ required: true, min: 0 }) price!: number;
  @Prop({ required: true, min: 1 }) durationDays!: number;
  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] }) status!:
    'ACTIVE' | 'INACTIVE';
}
export const PremiumPlanSchema = SchemaFactory.createForClass(PremiumPlan);
