import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ReadingRight {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) bookId!: string;
  @Prop({ required: true, enum: ['PURCHASE', 'DEMO', 'MANUAL'] }) source!:
    'PURCHASE' | 'DEMO' | 'MANUAL';
  @Prop({ default: '' }) reason!: string;
  @Prop() orderCode?: number;
  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'REVOKED'] }) status!:
    'ACTIVE' | 'REVOKED';
  @Prop({ default: Date.now }) grantedAt!: Date;
}

export const ReadingRightSchema = SchemaFactory.createForClass(ReadingRight);
ReadingRightSchema.index({ userId: 1, bookId: 1 }, { unique: true });
