import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class PasswordResetOtp {
  @Prop({ required: true, lowercase: true, index: true }) email!: string;
  @Prop({ required: true, select: false }) codeHash!: string;
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop({ default: 0 }) attempts!: number;
  @Prop({ type: Date, default: null }) consumedAt!: Date | null;
  @Prop({ type: String, default: null, select: false }) resetJti!: string | null;
  @Prop({ type: Date, default: null }) resetUsedAt!: Date | null;
}

export const PasswordResetOtpSchema =
  SchemaFactory.createForClass(PasswordResetOtp);
PasswordResetOtpSchema.index({ email: 1 }, { unique: true });
