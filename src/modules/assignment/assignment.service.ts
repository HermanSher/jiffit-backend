import { AssignmentAttemptStatus, BookingStatus } from "@prisma/client";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { eventBusService } from "../events/event-bus.service";
import { notificationService } from "../notifications/notification.service";
import {
  enqueueAssignmentRetry,
  enqueueAssignmentTimeout,
  registerAssignmentQueueProcessors,
} from "./assignment.queue";
import { assignmentEngine } from "./assignment.engine";
import { assignmentRepository } from "./assignment.repository";

function parseIntEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}

const ASSIGNMENT_TIMEOUT_SECONDS = parseIntEnv("ASSIGNMENT_TIMEOUT_SECONDS", 45);
const ASSIGNMENT_MAX_RETRIES = parseIntEnv("ASSIGNMENT_MAX_RETRIES", 5);
const ASSIGNMENT_RETRY_DELAY_SECONDS = parseIntEnv("ASSIGNMENT_RETRY_DELAY_SECONDS", 5);
const ASSIGNMENT_ALLOW_REPEAT_WORKER = (process.env.ASSIGNMENT_ALLOW_REPEAT_WORKER ?? "false").toLowerCase() === "true";

class AssignmentService {
  constructor() {
    registerAssignmentQueueProcessors({
      onTimeout: async (job) => this.handleTimeoutJob(job.attemptId, job.bookingId),
      onRetry: async (job) => {
        await this.dispatchAssignment(job.bookingId, undefined, job.reason);
      },
    });
  }

  private async chooseNextCandidate(iBookingTransId: number, iServiceMasterId: number, serviceAddressSnapshot: unknown) {
    const [candidates, previousAttempts] = await Promise.all([
      assignmentEngine.findRankedCandidates(iServiceMasterId, serviceAddressSnapshot),
      assignmentRepository.getExistingAttemptsForBooking(iBookingTransId),
    ]);

    if (candidates.length === 0) {
      return null;
    }

    const previouslyTriedUsers = new Set(previousAttempts.map((attempt) => attempt.iHeroUserMasterId));
    const filteredCandidates = ASSIGNMENT_ALLOW_REPEAT_WORKER
      ? candidates
      : candidates.filter((candidate) => !previouslyTriedUsers.has(candidate.iHeroUserMasterId));

    if (filteredCandidates.length === 0) {
      return null;
    }

    const maxAttempt = previousAttempts.length > 0
      ? Math.max(...previousAttempts.map((attempt) => attempt.attemptNumber))
      : 0;

    return {
      candidate: filteredCandidates[0],
      nextAttemptNumber: maxAttempt + 1,
    };
  }

  private async enqueueTimeoutForAttempt(input: { attemptId: number; bookingId: number }) {
    await enqueueAssignmentTimeout(
      {
        attemptId: input.attemptId,
        bookingId: input.bookingId,
      },
      ASSIGNMENT_TIMEOUT_SECONDS * 1000,
    );
  }

  async dispatchAssignment(iBookingTransId: number, actor?: AuthenticatedUser, reason = "initial-dispatch") {
    const booking = await assignmentRepository.getBookingForDispatch(iBookingTransId);
    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    if (!booking.iServiceMasterId) {
      throw new ApiError(400, "Booking service is not selected.");
    }

    if (!([BookingStatus.CONFIRMED, BookingStatus.ASSIGNMENT_PENDING] as BookingStatus[]).includes(booking.bookingStatus)) {
      return {
        message: `Booking status ${booking.bookingStatus} is not dispatchable.`,
        dispatched: false,
      };
    }

    const activeAssignment = await assignmentRepository.getActiveAssignmentForBooking(iBookingTransId);
    if (activeAssignment) {
      return {
        message: "Booking already has an active assignment.",
        dispatched: false,
      };
    }

    await assignmentRepository.moveBookingToAssignmentPending(iBookingTransId, actor?.iMasterId);
    const picked = await this.chooseNextCandidate(
      iBookingTransId,
      booking.iServiceMasterId,
      booking.serviceAddressSnapshot,
    );

    if (!picked) {
      await assignmentRepository.appendBookingHistory({
        iBookingTransId,
        fromStatus: BookingStatus.ASSIGNMENT_PENDING,
        toStatus: BookingStatus.ASSIGNMENT_PENDING,
        changedByUserMasterId: actor?.iMasterId,
        reason: `No eligible workers available (${reason}).`,
      });

      return {
        message: "No eligible workers available.",
        dispatched: false,
      };
    }

    const timeoutAt = new Date(Date.now() + ASSIGNMENT_TIMEOUT_SECONDS * 1000);
    const { assignment, attempt } = await assignmentRepository.createAssignmentForBooking({
      iBookingTransId,
      iHeroUserMasterId: picked.candidate.iHeroUserMasterId,
      attemptNumber: picked.nextAttemptNumber,
      timeoutAt,
      changedByUserMasterId: actor?.iMasterId,
    });

    await this.enqueueTimeoutForAttempt({
      attemptId: attempt.iTransId,
      bookingId: iBookingTransId,
    });

    eventBusService.emit("assignment_sent", {
      iBookingTransId,
      iHeroUserMasterId: picked.candidate.iHeroUserMasterId,
      iAttemptTransId: attempt.iTransId,
    });

    await notificationService.sendPlaceholder({
      eventType: "assignment_sent",
      userId: picked.candidate.iHeroUserMasterId,
      bookingId: iBookingTransId,
      payload: {
        iAssignmentTransId: assignment.iTransId,
        attemptNumber: picked.nextAttemptNumber,
        reason,
      },
    });

    return {
      dispatched: true,
      iAssignmentTransId: assignment.iTransId,
      iAttemptTransId: attempt.iTransId,
      iHeroUserMasterId: picked.candidate.iHeroUserMasterId,
      attemptNumber: picked.nextAttemptNumber,
    };
  }

  async retryAssignment(iBookingTransId: number, reason: string) {
    const previousAttempts = await assignmentRepository.getExistingAttemptsForBooking(iBookingTransId);
    if (previousAttempts.length >= ASSIGNMENT_MAX_RETRIES) {
      await assignmentRepository.appendBookingHistory({
        iBookingTransId,
        fromStatus: BookingStatus.ASSIGNMENT_PENDING,
        toStatus: BookingStatus.FAILED,
        reason: `Assignment retries exhausted. Last reason: ${reason}`,
      });

      return {
        dispatched: false,
        exhausted: true,
      };
    }

    await enqueueAssignmentRetry(
      {
        bookingId: iBookingTransId,
        reason,
      },
      ASSIGNMENT_RETRY_DELAY_SECONDS * 1000,
    );

    return {
      dispatched: false,
      retryQueued: true,
    };
  }

  async handleTimeoutJob(iAttemptTransId: number, iBookingTransId: number) {
    const attempt = await assignmentRepository.getAttemptById(iAttemptTransId);
    if (!attempt || attempt.status !== AssignmentAttemptStatus.PENDING) {
      return;
    }

    const timeoutMarked = await assignmentRepository.markAttemptTimedOut(iAttemptTransId);
    if (timeoutMarked.count === 0) {
      return;
    }

    await assignmentRepository.cancelActiveAssignment(
      attempt.iBookingTransId,
      attempt.iHeroUserMasterId,
      "Assignment timeout",
    );
    await assignmentRepository.setHeroAvailable(attempt.iHeroUserMasterId);
    await assignmentRepository.moveBookingBackToAssignmentPending(iBookingTransId);

    await assignmentRepository.appendBookingHistory({
      iBookingTransId,
      fromStatus: BookingStatus.ASSIGNED,
      toStatus: BookingStatus.ASSIGNMENT_PENDING,
      reason: "Assignment timed out. Retrying next worker.",
      metadataJson: {
        iAttemptTransId,
        iHeroUserMasterId: attempt.iHeroUserMasterId,
      },
    });

    eventBusService.emit("assignment_timeout", {
      iBookingTransId,
      iHeroUserMasterId: attempt.iHeroUserMasterId,
      iAttemptTransId,
    });

    await notificationService.sendPlaceholder({
      eventType: "assignment_timeout",
      userId: attempt.iHeroUserMasterId,
      bookingId: attempt.iBookingTransId,
      payload: {
        iAttemptTransId,
      },
    });

    await this.retryAssignment(iBookingTransId, "assignment-timeout");
  }
}

export const assignmentService = new AssignmentService();
