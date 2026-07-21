import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, select: false, default: null })
  passwordHash!: string | null;

  @Prop({ default: 'LOCAL', enum: ['LOCAL', 'GOOGLE'] })
  provider!: 'LOCAL' | 'GOOGLE';

  @Prop({ type: String, default: null, index: true, sparse: true })
  googleId!: string | null;

  @Prop({ type: String, default: null }) avatarUrl!: string | null;
  @Prop({ default: false }) emailVerified!: boolean;
  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'LOCKED'] }) status!:
    'ACTIVE' | 'LOCKED';

  @Prop({ default: 'USER', enum: ['USER', 'ADMIN'] })
  role!: 'USER' | 'ADMIN';
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
