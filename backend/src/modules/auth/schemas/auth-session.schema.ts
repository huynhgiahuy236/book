import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class AuthSession {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, unique: true, index: true }) jti!: string;
  @Prop({ required: true, select: false }) tokenHash!: string;
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop({ type: Date, default: null }) revokedAt!: Date | null;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);
