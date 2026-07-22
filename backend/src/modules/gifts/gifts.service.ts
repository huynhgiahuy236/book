import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GiftDto, ListGiftDto } from './dto/gift.dto';
import { Gift } from './schemas/gift.schema';

@Injectable()
export class GiftsService {
  constructor(@InjectModel(Gift.name) private readonly gifts: Model<Gift>) {}

  async list(dto: ListGiftDto) {
    const filter: Record<string, unknown> = {};
    if (dto.query)
      filter.$or = [
        { name: { $regex: dto.query, $options: 'i' } },
        { slug: { $regex: dto.query, $options: 'i' } },
      ];
    if (dto.status) filter.status = dto.status;
    const [items, totalItems] = await Promise.all([
      this.gifts
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((dto.page - 1) * dto.limit)
        .limit(dto.limit)
        .lean(),
      this.gifts.countDocuments(filter),
    ]);
    return {
      items,
      page: dto.page,
      limit: dto.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / dto.limit),
    };
  }

  active() {
    return this.gifts.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean();
  }

  async create(dto: GiftDto) {
    if (await this.gifts.exists({ slug: dto.slug }))
      throw new ConflictException('Slug quà tặng đã tồn tại');
    return this.gifts.create(dto);
  }

  async update(id: string, dto: GiftDto) {
    const conflict = await this.gifts.exists({
      slug: dto.slug,
      _id: { $ne: id },
    });
    if (conflict) throw new ConflictException('Slug quà tặng đã tồn tại');
    const gift = await this.gifts.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!gift) throw new NotFoundException('Không tìm thấy quà tặng');
    return gift;
  }

  async requireActive(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Quà tặng không hợp lệ');
    const gift = await this.gifts.findOne({ _id: id, status: 'ACTIVE' }).lean();
    if (!gift)
      throw new NotFoundException(
        'Quà tặng không tồn tại hoặc đã ngừng hoạt động',
      );
    return gift;
  }

  async snapshotsForBooks(
    books: Array<{ id: string; hasGift?: boolean; giftId?: unknown }>,
  ) {
    const linked = books.filter((book) => book.hasGift && book.giftId);
    return Promise.all(
      linked.map(async (book) => {
        const gift = await this.requireActive(String(book.giftId));
        if (gift.type === 'PHYSICAL' && gift.stock < 1)
          throw new ConflictException(`Quà tặng “${gift.name}” đã hết hàng`);
        return {
          bookId: book.id,
          giftId: String(gift._id),
          name: gift.name,
          type: gift.type,
          quantity: 1,
        };
      }),
    );
  }

  async consumePhysical(
    snapshots: Array<{
      giftId: string;
      name: string;
      type: string;
      quantity: number;
    }>,
  ) {
    for (const gift of snapshots.filter((item) => item.type === 'PHYSICAL')) {
      const result = await this.gifts.updateOne(
        { _id: gift.giftId, status: 'ACTIVE', stock: { $gte: gift.quantity } },
        { $inc: { stock: -gift.quantity } },
      );
      if (!result.modifiedCount)
        throw new ConflictException(`Quà tặng “${gift.name}” không đủ tồn kho`);
    }
  }

  async restorePhysical(
    snapshots: Array<{ giftId: string; type: string; quantity: number }>,
  ) {
    for (const gift of snapshots.filter((item) => item.type === 'PHYSICAL'))
      await this.gifts.updateOne(
        { _id: gift.giftId },
        { $inc: { stock: gift.quantity } },
      );
  }
  async setImage(id: string, imageUrl: string, imagePublicId: string) {
    const gift = await this.gifts.findByIdAndUpdate(
      id,
      { $set: { imageUrl, imagePublicId } },
      { new: true },
    );
    if (!gift) throw new NotFoundException('Không tìm thấy quà tặng');
    return gift;
  }
}
