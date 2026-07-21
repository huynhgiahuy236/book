import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ type: String, unique: true, sparse: true, index: true })
  clientRequestId?: string;
  @Prop({ required: true, unique: true, index: true }) orderCode!: number;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ type: [String], required: true }) bookIds!: string[];
  @Prop({ required: true, min: 0 }) amount!: number;
  @Prop({
    required: true,
    enum: ['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED'],
    default: 'PENDING_PAYMENT',
  })
  status!: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  @Prop({ required: true, enum: ['PAYOS', 'DEMO'] }) provider!:
    'PAYOS' | 'DEMO';
  @Prop() paymentLinkId?: string;
  @Prop() checkoutUrl?: string;
  @Prop() reference?: string;
  @Prop() paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
