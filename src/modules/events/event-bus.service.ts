import { EventEmitter } from "node:events";

export type SystemEventName =
  | "booking_created"
  | "booking_confirmed"
  | "assignment_sent"
  | "assignment_accepted"
  | "assignment_rejected"
  | "assignment_timeout"
  | "booking_started"
  | "booking_completed";

class EventBusService {
  private emitter = new EventEmitter();

  emit(eventName: SystemEventName, payload: Record<string, unknown>) {
    this.emitter.emit(eventName, payload);
  }

  on(eventName: SystemEventName, listener: (payload: Record<string, unknown>) => void) {
    this.emitter.on(eventName, listener);
  }
}

export const eventBusService = new EventBusService();
