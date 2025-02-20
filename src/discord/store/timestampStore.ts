import { StoreBase } from "../commands/StoreBase.js";

export class UsageStore extends StoreBase<object, "usage"> {
  override getKey() {
    return "usage" as const;
  }

  private defaultTTL: number = 600_000;

  private lastUsageByUser: {
    [userId: string]: number;
  } = {};

  private timeoutStore: {
    [userId: string]: NodeJS.Timeout;
  } = {};

  addUsageByUser(
    userId: string,
    lastUseTimestamp: number,
    ttl: number = this.defaultTTL,
  ) {
    this.lastUsageByUser[userId] = lastUseTimestamp;

    const previousTimeout = this.timeoutStore[userId];
    if (previousTimeout) {
      clearTimeout(previousTimeout);
    }

    const newTimeout = setTimeout(() => {
      delete this.lastUsageByUser[userId];
    }, ttl);

    this.timeoutStore[userId] = newTimeout;
  }

  getLastUsageByUser(userId: string): number | undefined {
    return this.lastUsageByUser[userId];
  }
}
