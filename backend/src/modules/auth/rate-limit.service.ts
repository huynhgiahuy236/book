import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, number[]>();

  hit(scope: string, subject: string, limit: number, windowMs: number) {
    const key = `${scope}:${subject.toLowerCase()}`;
    const threshold = Date.now() - windowMs;
    const attempts = (this.buckets.get(key) ?? []).filter(
      (time) => time > threshold,
    );
    if (attempts.length >= limit)
      throw new HttpException(
        'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    attempts.push(Date.now());
    this.buckets.set(key, attempts);
  }
}
