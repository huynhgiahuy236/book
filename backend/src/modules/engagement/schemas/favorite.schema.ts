import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Favorite {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) bookId!: string;
}
export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true });
