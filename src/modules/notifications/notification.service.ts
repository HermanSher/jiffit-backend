import { enqueueNotification } from "../queue/queue.tasks";

class NotificationService {
  async sendPlaceholder(input: {
    eventType: string;
    userId?: number;
    bookingId?: number;
    payload?: Record<string, unknown>;
  }) {
    await enqueueNotification({
      eventType: input.eventType,
      userId: input.userId,
      bookingId: input.bookingId,
      payload: input.payload,
    });
  }
}

export const notificationService = new NotificationService();
