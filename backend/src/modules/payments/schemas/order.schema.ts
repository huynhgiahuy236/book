import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ required: true, unique: true, index: true }) orderCode!: number;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ type: [String], required: true }) bookIds!: string[];
  @Prop({ required: true, min: 0 }) amount!: number;
  @Prop({
    required: true,
    enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED'],
    default: 'PENDING',
  })
  status!: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
  @Prop({ required: true, enum: ['PAYOS', 'DEMO'] }) provider!:
    'PAYOS' | 'DEMO';
  @Prop() paymentLinkId?: string;
  @Prop() checkoutUrl?: string;
  @Prop() reference?: string;
  @Prop() paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
