import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class ReadingProgress {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) bookId!: string;
  @Prop({ default: 0, min: 0 }) chapter!: number;
  @Prop({ default: 0, min: 0, max: 100 }) percent!: number;
}

export const ReadingProgressSchema =
  SchemaFactory.createForClass(ReadingProgress);
ReadingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });
