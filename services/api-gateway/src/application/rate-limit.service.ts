import type { AppConfig } from '../config/index';

interface RateBucket {
  count: number;
  resetAt: number;
}

export class RateLimitService {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly config: AppConfig) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      const resetAt = now + this.config.RATE_LIMIT_WINDOW_MS;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.config.RATE_LIMIT_MAX - 1, resetAt };
    }
    if (bucket.count >= this.config.RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }
    bucket.count += 1;
    return {
      allowed: true,
      remaining: this.config.RATE_LIMIT_MAX - bucket.count,
      resetAt: bucket.resetAt,
    };
  }
}
