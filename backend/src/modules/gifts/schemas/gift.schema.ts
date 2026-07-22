import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Gift {
  @Prop({ required: true, trim: true }) name!: string;
  @Prop({ required: true, unique: true, index: true }) slug!: string;
  @Prop({ default: '' }) description!: string;
  @Prop({ default: '' }) imageUrl!: string;
  @Prop({ type: String, default: null }) imagePublicId!: string | null;
  @Prop({ required: true, enum: ['PHYSICAL', 'DIGITAL'] }) type!:
    'PHYSICAL' | 'DIGITAL';
  @Prop({ default: 0, min: 0 }) stock!: number;
  @Prop({ default: 5, min: 0 }) lowStockThreshold!: number;
  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], index: true })
  status!: 'ACTIVE' | 'INACTIVE';
  @Prop({ type: Date, default: null }) startsAt!: Date | null;
  @Prop({ type: Date, default: null }) endsAt!: Date | null;
}

export const GiftSchema = SchemaFactory.createForClass(Gift);
