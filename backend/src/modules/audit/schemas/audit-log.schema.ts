import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class AuditLog {
  @Prop({ required: true, index: true }) actorId!: string;
  @Prop({ required: true }) actorEmail!: string;
  @Prop({ required: true, index: true }) action!: string;
  @Prop({ required: true, index: true }) entityType!: string;
  @Prop({ required: true, index: true }) entityId!: string;
  @Prop({ type: Object, default: {} }) metadata!: Record<string, unknown>;
}
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
