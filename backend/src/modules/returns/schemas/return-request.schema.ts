import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
@Schema({ timestamps: true, versionKey: false })
export class ReturnRequest {
  @Prop({ required: true, index: true }) orderCode!: number;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true }) reason!: string;
  @Prop({ type: [String], default: [] }) evidenceUrls!: string[];
  @Prop({
    default: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    index: true,
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  @Prop() adminNote?: string;
  @Prop() resolvedBy?: string;
  @Prop() resolvedAt?: Date;
}
export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
ReturnRequestSchema.index({ orderCode: 1, userId: 1 }, { unique: true });
