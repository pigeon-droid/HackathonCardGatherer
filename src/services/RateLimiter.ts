/**
 * Rate limiter to respect Scryfall's rate limit of 10 requests per second
 */
class RateLimiter {
  private lastRequestTime: number = 0;
  private readonly minDelayMs: number = 100; // 100ms = 10 requests per second

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      const delayNeeded = this.minDelayMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    this.lastRequestTime = Date.now();
  }
}

export const rateLimiter = new RateLimiter();

