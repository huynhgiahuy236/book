import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ReadingRight {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) bookId!: string;
  @Prop({ required: true, enum: ['PURCHASE', 'DEMO'] }) source!:
    'PURCHASE' | 'DEMO';
  @Prop() orderCode?: number;
}

export const ReadingRightSchema = SchemaFactory.createForClass(ReadingRight);
ReadingRightSchema.index({ userId: 1, bookId: 1 }, { unique: true });
