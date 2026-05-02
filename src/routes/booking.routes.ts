import { Router } from "express";
import { permissionCodes } from "../constants/permission-codes";
import { requirePermission } from "../middlewares/permission.middleware";
import {
  createBooking,
  deleteBooking,
  getBookingById,
  getBookings,
  restoreBooking,
  updateBooking,
  updateBookingStatus,
} from "../modules/booking/booking.controller";

const bookingRouter = Router();

bookingRouter.post("/", requirePermission(permissionCodes.BOOKINGS_CREATE), createBooking);
bookingRouter.get("/", requirePermission(permissionCodes.BOOKINGS_VIEW), getBookings);
bookingRouter.get("/:id", requirePermission(permissionCodes.BOOKINGS_VIEW), getBookingById);
bookingRouter.patch("/:id/restore", requirePermission(permissionCodes.BOOKINGS_UPDATE), restoreBooking);
bookingRouter.patch("/:id/status", requirePermission(permissionCodes.BOOKINGS_UPDATE), updateBookingStatus);
bookingRouter.patch("/:id", requirePermission(permissionCodes.BOOKINGS_UPDATE), updateBooking);
bookingRouter.delete("/:id", requirePermission(permissionCodes.BOOKINGS_DELETE), deleteBooking);

export default bookingRouter;
