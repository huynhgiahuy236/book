import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ type: String, unique: true, sparse: true, index: true })
  clientRequestId?: string;
  @Prop({ required: true, unique: true, index: true }) orderCode!: number;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ type: [String], required: true }) bookIds!: string[];
  @Prop({
    type: [
      {
        bookId: String,
        giftId: String,
        name: String,
        type: String,
        quantity: Number,
      },
    ],
    _id: false,
    default: [],
  })
  giftSnapshots!: Array<{
    bookId: string;
    giftId: string;
    name: string;
    type: 'PHYSICAL' | 'DIGITAL';
    quantity: number;
  }>;
  @Prop({ required: true, min: 0 }) amount!: number;
  @Prop({
    required: true,
    enum: [
      'PENDING_PAYMENT',
      'PAID',
      'PROCESSING',
      'SHIPPING',
      'COMPLETED',
      'CANCELLED',
      'EXPIRED',
      'FAILED',
      'REFUNDED',
    ],
    default: 'PENDING_PAYMENT',
  })
  status!:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'FAILED'
    | 'REFUNDED';
  @Prop({ required: true, enum: ['PAYOS', 'DEMO'] }) provider!:
    'PAYOS' | 'DEMO';
  @Prop() paymentLinkId?: string;
  @Prop() checkoutUrl?: string;
  @Prop() reference?: string;
  @Prop() paidAt?: Date;
  @Prop({ default: false }) giftStockRestored!: boolean;
  @Prop({
    type: [{ status: String, at: Date, actorId: String, note: String }],
    _id: false,
    default: [],
  })
  statusHistory!: Array<{
    status: string;
    at: Date;
    actorId?: string;
    note?: string;
  }>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
