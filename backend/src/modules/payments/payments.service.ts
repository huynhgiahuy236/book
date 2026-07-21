import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PayOS } from '@payos/node';
import type { Webhook } from '@payos/node/lib/resources/webhooks/webhook';
import { Model } from 'mongoose';
import type { AuthUser } from '../auth/types/auth-user.type';
import { BooksService } from '../books/books.service';
import { LibraryService } from '../library/library.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from './schemas/order.schema';

@Injectable()
export class PaymentsService {
  private readonly payOS: PayOS;

  constructor(
    private readonly config: ConfigService,
    private readonly books: BooksService,
    private readonly library: LibraryService,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
  ) {
    this.payOS = new PayOS({
      clientId: config.getOrThrow<string>('PAYOS_CLIENT_ID'),
      apiKey: config.getOrThrow<string>('PAYOS_API_KEY'),
      checksumKey: config.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    });
  }

  async create(dto: CreatePaymentDto, user: AuthUser) {
    const books = await this.books.findMany(dto.bookIds);
    const amount = books.reduce((sum, book) => sum + book.price, 0);
    const orderCode = await this.nextOrderCode();
    const expiresIn = this.config.get<number>(
      'PAYOS_PAYMENT_EXPIRES_MINUTES',
      15,
    );
    const order = await this.orders.create({
      orderCode,
      userId: user.sub,
      bookIds: books.map((book) => book.id),
      amount,
      status: 'PENDING',
      provider: 'PAYOS',
    });

    try {
      const payment = await this.payOS.paymentRequests.create({
        orderCode,
        amount,
        description: `CB ${orderCode}`,
        returnUrl: `${this.config.getOrThrow<string>('PAYOS_RETURN_URL')}?orderCode=${orderCode}`,
        cancelUrl: `${this.config.getOrThrow<string>('PAYOS_CANCEL_URL')}?orderCode=${orderCode}`,
        expiredAt: Math.floor(Date.now() / 1000) + expiresIn * 60,
        buyerEmail: user.email,
        buyerName: user.name,
        items: books.map((book) => ({
          name: book.title.slice(0, 100),
          quantity: 1,
          price: book.price,
        })),
      });
      await this.orders.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentLinkId: payment.paymentLinkId,
            checkoutUrl: payment.checkoutUrl,
          },
        },
      );
      return { ...payment, internalOrderId: String(order._id) };
    } catch (error) {
      await this.orders.updateOne(
        { _id: order._id },
        { $set: { status: 'FAILED' } },
      );
      throw error;
    }
  }

  async verifyWebhook(payload: Webhook) {
    const data = await this.payOS.webhooks.verify(payload);
    const order = await this.orders.findOne({ orderCode: data.orderCode });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.amount !== data.amount)
      throw new BadRequestException('Số tiền webhook không khớp đơn hàng');
    if (order.status !== 'PAID') {
      order.status = 'PAID';
      order.reference = data.reference;
      order.paymentLinkId = data.paymentLinkId;
      order.paidAt = new Date();
      await order.save();
      await this.library.grant(
        order.userId,
        order.bookIds,
        'PURCHASE',
        order.orderCode,
      );
    }
    return {
      success: true,
      orderCode: data.orderCode,
      reference: data.reference,
    };
  }

  async demoPurchase(dto: CreatePaymentDto, user: AuthUser) {
    this.assertDevelopment();
    const books = await this.books.findMany(dto.bookIds);
    const orderCode = await this.nextOrderCode();
    const order = await this.orders.create({
      orderCode,
      userId: user.sub,
      bookIds: books.map((book) => book.id),
      amount: books.reduce((sum, book) => sum + book.price, 0),
      status: 'PAID',
      provider: 'DEMO',
      reference: `LOCAL-${orderCode}`,
      paidAt: new Date(),
    });
    await this.library.grant(user.sub, order.bookIds, 'DEMO', orderCode);
    return {
      success: true,
      orderCode,
      bookIds: order.bookIds,
      mode: 'DEVELOPMENT_ONLY',
    };
  }

  async demoConfirm(orderCode: number, user: AuthUser) {
    this.assertDevelopment();
    const order = await this.orders.findOne({ orderCode, userId: user.sub });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');
    if (order.status !== 'PAID') {
      order.status = 'PAID';
      order.reference = `LOCAL-${orderCode}`;
      order.paidAt = new Date();
      await order.save();
      await this.library.grant(user.sub, order.bookIds, 'DEMO', orderCode);
    }
    return { success: true, orderCode, bookIds: order.bookIds };
  }

  private assertDevelopment() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Luồng xác nhận demo bị tắt ở production');
    }
  }

  private async nextOrderCode() {
    let orderCode = Number(`${Date.now()}`.slice(-10));
    while (await this.orders.exists({ orderCode })) orderCode += 1;
    return orderCode;
  }
}
