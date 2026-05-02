import { Queue } from "bullmq";
import IORedis from "ioredis";

type QueueName =
  | "assignment-timeout"
  | "assignment-retry"
  | "notifications"
  | "payment-webhooks";

class QueueManager {
  private readonly redisUrl = process.env.REDIS_URL?.trim();
  private readonly connection: IORedis | null;
  private readonly queues = new Map<QueueName, Queue>();

  constructor() {
    if (!this.redisUrl) {
      this.connection = null;
      console.warn("[queue] REDIS_URL is not configured. Queue system is disabled.");
      return;
    }

    this.connection = new IORedis(this.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  isEnabled(): boolean {
    return this.connection !== null;
  }

  getConnection(): IORedis | null {
    return this.connection;
  }

  getQueue(name: QueueName): Queue | null {
    if (!this.connection) {
      return null;
    }

    const existing = this.queues.get(name);
    if (existing) {
      return existing;
    }

    const queue = new Queue(name, { connection: this.connection });
    this.queues.set(name, queue);
    return queue;
  }
}

export const queueManager = new QueueManager();
