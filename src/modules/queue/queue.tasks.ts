import { queueManager } from "./queue.manager";

async function enqueue(queueName: "notifications" | "payment-webhooks", name: string, data: unknown, delayMs = 0) {
  const queue = queueManager.getQueue(queueName);
  if (!queue) {
    return;
  }

  await queue.add(name, data, {
    delay: delayMs,
    removeOnComplete: true,
    removeOnFail: 100,
  });
}

export async function enqueueNotification(data: {
  eventType: string;
  userId?: number;
  bookingId?: number;
  payload?: Record<string, unknown>;
}) {
  await enqueue("notifications", "notify", data);
}

export async function enqueuePaymentWebhookProcessing(data: {
  paymentWebhookId: number;
  provider: string;
}) {
  await enqueue("payment-webhooks", "payment-webhook-process", data);
}
