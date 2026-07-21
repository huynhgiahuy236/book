import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Review {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) bookId!: string;
  @Prop({ required: true }) authorName!: string;
  @Prop({ required: true, min: 1, max: 5 }) rating!: number;
  @Prop({ required: true, trim: true, maxlength: 1200 }) content!: string;
  @Prop({ default: 'PUBLISHED', enum: ['PUBLISHED', 'HIDDEN'] }) status!: 'PUBLISHED' | 'HIDDEN';
}
export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });
