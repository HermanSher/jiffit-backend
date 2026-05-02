import { Job, Worker } from "bullmq";
import { queueManager } from "../queue/queue.manager";

type AssignmentTimeoutJobData = {
  attemptId: number;
  bookingId: number;
};

type AssignmentRetryJobData = {
  bookingId: number;
  reason: string;
};

type AssignmentQueueHandlers = {
  onTimeout: (data: AssignmentTimeoutJobData) => Promise<void>;
  onRetry: (data: AssignmentRetryJobData) => Promise<void>;
};

let workersStarted = false;

async function addJob<T>(queueName: "assignment-timeout" | "assignment-retry", name: string, data: T, delayMs = 0) {
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

export async function enqueueAssignmentTimeout(data: AssignmentTimeoutJobData, delayMs: number) {
  await addJob("assignment-timeout", "assignment-timeout", data, delayMs);
}

export async function enqueueAssignmentRetry(data: AssignmentRetryJobData, delayMs: number) {
  await addJob("assignment-retry", "assignment-retry", data, delayMs);
}

export function registerAssignmentQueueProcessors(handlers: AssignmentQueueHandlers) {
  if (!queueManager.isEnabled() || workersStarted) {
    return;
  }

  const connection = queueManager.getConnection();
  if (!connection) {
    return;
  }

  new Worker(
    "assignment-timeout",
    async (job: Job<AssignmentTimeoutJobData>) => {
      await handlers.onTimeout(job.data);
    },
    { connection },
  );

  new Worker(
    "assignment-retry",
    async (job: Job<AssignmentRetryJobData>) => {
      await handlers.onRetry(job.data);
    },
    { connection },
  );

  workersStarted = true;
}
