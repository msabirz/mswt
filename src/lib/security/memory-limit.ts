/**
 * Fixed-window request counter kept in this server instance's memory. Best effort: each serverless
 * instance counts on its own, so it caps bursts against one instance rather than giving a global
 * guarantee. Used where a database lookup per request would itself be the cost to avoid.
 */
export class MemoryRateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Records a hit; true when the key is over the limit for the current window. */
  limited(key: string, now: number = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size > 10_000) this.prune(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }
    entry.count++;
    return entry.count > this.limit;
  }

  private prune(now: number) {
    for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
  }
}
