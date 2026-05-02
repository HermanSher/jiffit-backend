import { WorkerState } from "@prisma/client";
import { locationConfig } from "../../config/location.config";
import { assignmentService } from "../assignment/assignment.service";
import { eventBusService } from "../events/event-bus.service";
import { AuthenticatedUser } from "../../types/auth";
import { ApiError } from "../../utils/api-error";
import { workerRepository } from "./worker.repository";

const HERO_MARKERS = new Set(["HERO", "WORKER", "UT_HERO", "UT_WORKER"]);

const WORKER_TRANSITIONS: Record<WorkerState, WorkerState[]> = {
  [WorkerState.OFFLINE]: [WorkerState.ONLINE],
  [WorkerState.ONLINE]: [WorkerState.AVAILABLE, WorkerState.OFFLINE],
  [WorkerState.AVAILABLE]: [WorkerState.ASSIGNED, WorkerState.OFFLINE],
  [WorkerState.ASSIGNED]: [WorkerState.ACCEPTED, WorkerState.AVAILABLE, WorkerState.OFFLINE],
  [WorkerState.ACCEPTED]: [WorkerState.TRAVELLING, WorkerState.OFFLINE],
  [WorkerState.TRAVELLING]: [WorkerState.IN_PROGRESS, WorkerState.OFFLINE],
  [WorkerState.IN_PROGRESS]: [WorkerState.COMPLETED, WorkerState.OFFLINE],
  [WorkerState.COMPLETED]: [WorkerState.AVAILABLE, WorkerState.OFFLINE],
};

class WorkerService {
  private assertWorkerUser(user: AuthenticatedUser): void {
    const code = user.userTypeCode?.trim().toUpperCase();
    const name = user.userTypeName?.trim().toUpperCase();

    if ((!code || !HERO_MARKERS.has(code)) && name !== "HERO" && name !== "WORKER") {
      throw new ApiError(403, "Only hero/worker users can access worker APIs.");
    }
  }

  private toAvailabilityFlag(state: WorkerState): boolean {
    return state === WorkerState.AVAILABLE;
  }

  private assertTransition(current: WorkerState, next: WorkerState): void {
    if (current === next) {
      return;
    }

    if (current === WorkerState.IN_PROGRESS && ([WorkerState.ASSIGNED, WorkerState.ACCEPTED] as WorkerState[]).includes(next)) {
      throw new ApiError(400, "Worker cannot take a new job while IN_PROGRESS.");
    }

    if (next === WorkerState.ACCEPTED && !([WorkerState.ASSIGNED, WorkerState.AVAILABLE] as WorkerState[]).includes(current)) {
      throw new ApiError(400, "Worker cannot accept a job unless currently assigned/available.");
    }

    const allowed = WORKER_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ApiError(400, `Invalid worker state transition from ${current} to ${next}.`);
    }
  }

  private isLocationFresh(lastUpdatedAt: Date): boolean {
    const staleMs = locationConfig.heroLocationStaleSeconds * 1000;
    return Date.now() - lastUpdatedAt.getTime() <= staleMs;
  }

  async goOnline(user: AuthenticatedUser) {
    this.assertWorkerUser(user);
    const profile = await workerRepository.getHeroProfileByUserId(user.iMasterId);
    if (!profile || !profile.isActive) {
      throw new ApiError(404, "Active hero profile not found.");
    }

    this.assertTransition(profile.workerState, WorkerState.ONLINE);
    return workerRepository.updateWorkerState(user.iMasterId, WorkerState.ONLINE, false);
  }

  async goOffline(user: AuthenticatedUser) {
    this.assertWorkerUser(user);
    const profile = await workerRepository.getHeroProfileByUserId(user.iMasterId);
    if (!profile || !profile.isActive) {
      throw new ApiError(404, "Active hero profile not found.");
    }

    if (profile.workerState === WorkerState.OFFLINE) {
      await workerRepository.clearHeroLiveLocation(user.iMasterId);
      return profile;
    }

    this.assertTransition(profile.workerState, WorkerState.OFFLINE);
    const updated = await workerRepository.updateWorkerState(user.iMasterId, WorkerState.OFFLINE, false);
    await workerRepository.clearHeroLiveLocation(user.iMasterId);
    return updated;
  }

  async updateState(user: AuthenticatedUser, state: WorkerState) {
    this.assertWorkerUser(user);
    const profile = await workerRepository.getHeroProfileByUserId(user.iMasterId);
    if (!profile || !profile.isActive) {
      throw new ApiError(404, "Active hero profile not found.");
    }

    this.assertTransition(profile.workerState, state);

    if (state === WorkerState.AVAILABLE) {
      const liveLocation = await workerRepository.getHeroLiveLocation(user.iMasterId);
      if (!liveLocation || !this.isLocationFresh(liveLocation.lastUpdatedAt)) {
        throw new ApiError(
          400,
          "Cannot move to AVAILABLE without a recent live location update.",
        );
      }
    }

    if (state === WorkerState.ACCEPTED) {
      const accepted = await workerRepository.acceptAssignedBooking(user.iMasterId, user.iMasterId);
      if (!accepted) {
        throw new ApiError(400, "No ASSIGNED booking is available to accept.");
      }

      eventBusService.emit("assignment_accepted", {
        iBookingTransId: accepted.iBookingTransId,
        iHeroUserMasterId: user.iMasterId,
      });
    }

    if (state === WorkerState.AVAILABLE && profile.workerState === WorkerState.ASSIGNED) {
      const rejected = await workerRepository.rejectAssignedBooking(user.iMasterId, user.iMasterId);
      if (rejected) {
        eventBusService.emit("assignment_rejected", {
          iBookingTransId: rejected.iBookingTransId,
          iHeroUserMasterId: user.iMasterId,
        });
        await assignmentService.retryAssignment(rejected.iBookingTransId, "worker-rejected");
      }
    }

    if (state === WorkerState.IN_PROGRESS) {
      const started = await workerRepository.startAcceptedBooking(user.iMasterId, user.iMasterId);
      if (!started) {
        throw new ApiError(400, "No ACCEPTED booking is available to start.");
      }

      eventBusService.emit("booking_started", {
        iBookingTransId: started.iBookingTransId,
        iHeroUserMasterId: user.iMasterId,
      });
    }

    if (state === WorkerState.COMPLETED) {
      const completed = await workerRepository.completeStartedBooking(user.iMasterId, user.iMasterId);
      if (!completed) {
        throw new ApiError(400, "No IN_PROGRESS booking is available to complete.");
      }

      eventBusService.emit("booking_completed", {
        iBookingTransId: completed.iBookingTransId,
        iHeroUserMasterId: user.iMasterId,
      });
    }

    return workerRepository.updateWorkerState(user.iMasterId, state, this.toAvailabilityFlag(state));
  }
}

export const workerService = new WorkerService();
