import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly logs: Model<AuditLog>,
  ) {}
  record(
    user: AuthUser,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown> = {},
  ) {
    return this.logs.create({
      actorId: user.sub,
      actorEmail: user.email,
      action,
      entityType,
      entityId,
      metadata,
    });
  }
  list(page = 1, limit = 20) {
    return Promise.all([
      this.logs
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.logs.countDocuments(),
    ]).then(([items, totalItems]) => ({
      items,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    }));
  }
}
