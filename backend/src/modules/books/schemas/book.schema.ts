import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Book {
  @Prop({ required: true, unique: true, index: true }) id!: string;
  @Prop({ required: true, index: true }) slug!: string;
  @Prop({ required: true }) externalId!: string;
  @Prop({ required: true }) source!: string;
  @Prop({ required: true }) sourceUrl!: string;
  @Prop({ required: true, index: 'text' }) title!: string;
  @Prop({ default: '' }) subtitle!: string;
  @Prop({ type: [String], default: [] }) authors!: string[];
  @Prop({ default: '' }) publisher!: string;
  @Prop({ type: String, default: null }) publishedDate!: string | null;
  @Prop({ default: '' }) description!: string;
  @Prop({ type: String, default: null }) isbn10!: string | null;
  @Prop({ type: String, default: null }) isbn13!: string | null;
  @Prop({ type: Number, default: null }) pageCount!: number | null;
  @Prop({ default: 'eng' }) language!: string;
  @Prop({ type: [String], default: [] }) categories!: string[];
  @Prop({ default: '' }) coverUrl!: string;
  @Prop({ default: '' }) previewUrl!: string;
  @Prop({ type: Number, default: null }) averageRating!: number | null;
  @Prop({ default: 0 }) ratingsCount!: number;
  @Prop({ enum: ['EBOOK', 'PHYSICAL'], default: 'EBOOK' }) format!:
    'EBOOK' | 'PHYSICAL';
  @Prop({ enum: ['FREE', 'PREMIUM', 'PURCHASE'], default: 'PURCHASE' })
  accessType!: 'FREE' | 'PREMIUM' | 'PURCHASE';
  @Prop({
    enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true,
  })
  status!: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  @Prop({ default: false }) readingEnabled!: boolean;
  @Prop({ default: false }) premium!: boolean;
  @Prop({ required: true, min: 0 }) price!: number;
  @Prop({ min: 0, default: 0 }) ebookPrice!: number;
  @Prop({ min: 0, default: 0 }) physicalPrice!: number;
  @Prop({ min: 0, default: 0 }) stock!: number;
  @Prop({
    type: {
      originalFileName: String,
      objectKey: String,
      storageProvider: { type: String, enum: ['LOCAL', 'S3'] },
      mimeType: String,
      fileSize: Number,
      pageCount: Number,
    },
    _id: false,
    default: null,
  })
  ebookFile!: {
    originalFileName: string;
    objectKey: string;
    storageProvider: 'LOCAL' | 'S3';
    mimeType: string;
    fileSize?: number;
    pageCount?: number;
  } | null;
  @Prop({ default: 'DEMO_PRICE_NOT_RETAIL' }) pricingNote!: string;
  @Prop() importedAt!: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
