import { Router } from "express";
import { permissionCodes } from "../constants/permission-codes";
import { createCrudRouter } from "./crud-router";
import bookingRouter from "./booking.routes";

const architectureRouter = Router();

architectureRouter.use(
  "/user-addresses",
  createCrudRouter({
    tag: "User Address",
    model: "mUserAddresses",
    idField: "iMasterId",
    createFields: {
      iUserMasterId: "int",
      addressType: "enum",
      addressLine1: "string",
      addressLine2: "string",
      landmark: "string",
      city: "string",
      state: "string",
      pincode: "string",
      latitude: "decimal",
      longitude: "decimal",
      isDefault: "boolean",
      isActive: "boolean",
    },
    searchableFields: ["addressLine1", "city", "state", "pincode"],
    permissions: {
      view: permissionCodes.USERS_VIEW,
      create: permissionCodes.USERS_CREATE,
      update: permissionCodes.USERS_UPDATE,
      delete: permissionCodes.USERS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/hero-profiles",
  createCrudRouter({
    tag: "Hero Profile",
    model: "mHeroProfiles",
    idField: "iMasterId",
    createFields: {
      iUserMasterId: "int",
      heroCode: "string",
      governmentIdNumber: "string",
      skillSummary: "string",
      averageRating: "decimal",
      totalRatings: "int",
      isAvailable: "boolean",
    },
    searchableFields: ["heroCode", "governmentIdNumber", "skillSummary"],
    permissions: {
      view: permissionCodes.USERS_VIEW,
      create: permissionCodes.USERS_CREATE,
      update: permissionCodes.USERS_UPDATE,
      delete: permissionCodes.USERS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/customer-profiles",
  createCrudRouter({
    tag: "Customer Profile",
    model: "mCustomerProfiles",
    idField: "iMasterId",
    createFields: {
      iUserMasterId: "int",
      customerCode: "string",
      averageRating: "decimal",
      totalRatings: "int",
    },
    searchableFields: ["customerCode"],
    permissions: {
      view: permissionCodes.USERS_VIEW,
      create: permissionCodes.USERS_CREATE,
      update: permissionCodes.USERS_UPDATE,
      delete: permissionCodes.USERS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/employee-profiles",
  createCrudRouter({
    tag: "Employee Profile",
    model: "mEmployeeProfiles",
    idField: "iMasterId",
    createFields: {
      iUserMasterId: "int",
      employeeCode: "string",
      designation: "string",
      department: "string",
    },
    searchableFields: ["employeeCode", "designation", "department"],
    permissions: {
      view: permissionCodes.USERS_VIEW,
      create: permissionCodes.USERS_CREATE,
      update: permissionCodes.USERS_UPDATE,
      delete: permissionCodes.USERS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/service-categories",
  createCrudRouter({
    tag: "Service Category",
    model: "mServiceCategories",
    idField: "iMasterId",
    createFields: {
      sCode: "string",
      sName: "string",
      description: "string",
      displayOrder: "int",
      isActive: "boolean",
    },
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/service-types",
  createCrudRouter({
    tag: "Service Type",
    model: "mServiceTypes",
    idField: "iMasterId",
    createFields: {
      sCode: "string",
      sName: "string",
      description: "string",
      isActive: "boolean",
    },
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/services",
  createCrudRouter({
    tag: "Service",
    model: "mServices",
    idField: "iMasterId",
    createFields: {
      iServiceCategoryMasterId: "int",
      iServiceTypeMasterId: "int",
      sCode: "string",
      sName: "string",
      description: "string",
      shortDescription: "string",
      basePrice: "decimal",
      salePrice: "decimal",
      taxPercentage: "decimal",
      estimatedDurationMinutes: "int",
      minQuantity: "int",
      maxQuantity: "int",
      isSlotRequired: "boolean",
      isSubscriptionEligible: "boolean",
      requiresBeforeImage: "boolean",
      requiresAfterImage: "boolean",
      isActive: "boolean",
    },
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/service-slots",
  createCrudRouter({
    tag: "Service Slot",
    model: "mServiceSlots",
    idField: "iMasterId",
    createFields: {
      iServiceMasterId: "int",
      slotName: "string",
      startTime: "time",
      endTime: "time",
      maxBookings: "int",
      isActive: "boolean",
    },
    searchableFields: ["slotName"],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/service-images",
  createCrudRouter({
    tag: "Service Image",
    model: "mServiceImages",
    idField: "iMasterId",
    createFields: {
      iServiceMasterId: "int",
      imageUrl: "string",
      imageType: "enum",
      displayOrder: "int",
      isActive: "boolean",
    },
    searchableFields: ["imageUrl", "imageType"],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/subscription-types",
  createCrudRouter({
    tag: "Subscription Type",
    model: "mSubscriptionTypes",
    idField: "iMasterId",
    createFields: {
      sCode: "string",
      sName: "string",
      description: "string",
      durationDays: "int",
      discountPercent: "decimal",
      isActive: "boolean",
    },
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/subscriptions",
  createCrudRouter({
    tag: "Subscription",
    model: "mSubscriptions",
    idField: "iMasterId",
    createFields: {
      iSubscriptionTypeMasterId: "int",
      iCustomerUserMasterId: "int",
      startAt: "date",
      endAt: "date",
      status: "enum",
      isActive: "boolean",
    },
    searchableFields: ["status"],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/coupons",
  createCrudRouter({
    tag: "Coupon",
    model: "mCoupons",
    idField: "iMasterId",
    createFields: {
      sCode: "string",
      sName: "string",
      description: "string",
      discountType: "enum",
      discountValue: "decimal",
      maxDiscountAmount: "decimal",
      minOrderAmount: "decimal",
      startAt: "date",
      endAt: "date",
      usageLimit: "int",
      perUserLimit: "int",
      isActive: "boolean",
    },
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/coupon-service-mappings",
  createCrudRouter({
    tag: "Coupon Service Mapping",
    model: "mCouponServiceMappings",
    idField: "iMasterId",
    createFields: {
      iCouponMasterId: "int",
      iServiceMasterId: "int",
      isActive: "boolean",
    },
    searchableFields: [],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/hero-service-mappings",
  createCrudRouter({
    tag: "Hero Service Mapping",
    model: "mHeroServiceMappings",
    idField: "iMasterId",
    createFields: {
      iHeroUserMasterId: "int",
      iServiceMasterId: "int",
      isActive: "boolean",
    },
    searchableFields: [],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use(
  "/hero-service-areas",
  createCrudRouter({
    tag: "Hero Service Area",
    model: "mHeroServiceAreas",
    idField: "iMasterId",
    createFields: {
      iHeroUserMasterId: "int",
      city: "string",
      state: "string",
      pincode: "string",
      latitude: "decimal",
      longitude: "decimal",
      radiusKm: "decimal",
      isActive: "boolean",
    },
    searchableFields: ["city", "state", "pincode"],
    permissions: {
      view: permissionCodes.SERVICES_VIEW,
      create: permissionCodes.SERVICES_CREATE,
      update: permissionCodes.SERVICES_UPDATE,
      delete: permissionCodes.SERVICES_DELETE,
    },
  }),
);

architectureRouter.use("/bookings", bookingRouter);

architectureRouter.use(
  "/booking-assignments",
  createCrudRouter({
    tag: "Booking Assignment",
    model: "tBookingAssignments",
    idField: "iTransId",
    createFields: {
      iBookingTransId: "int",
      iHeroUserMasterId: "int",
      assignedAt: "date",
      acceptedAt: "date",
      startedAt: "date",
      completedAt: "date",
      status: "enum",
      remarks: "string",
    },
    searchableFields: ["status", "remarks"],
    permissions: {
      view: permissionCodes.ASSIGNMENTS_VIEW,
      create: permissionCodes.ASSIGNMENTS_CREATE,
      update: permissionCodes.ASSIGNMENTS_UPDATE,
      delete: permissionCodes.ASSIGNMENTS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/booking-images",
  createCrudRouter({
    tag: "Booking Image",
    model: "tBookingImages",
    idField: "iTransId",
    createFields: {
      iBookingTransId: "int",
      imageType: "enum",
      imageUrl: "string",
      uploadedByUserMasterId: "int",
      remarks: "string",
    },
    searchableFields: ["imageType", "imageUrl", "remarks"],
    permissions: {
      view: permissionCodes.BOOKINGS_VIEW,
      create: permissionCodes.BOOKINGS_CREATE,
      update: permissionCodes.BOOKINGS_UPDATE,
      delete: permissionCodes.BOOKINGS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/booking-ratings",
  createCrudRouter({
    tag: "Booking Rating",
    model: "tBookingRatings",
    idField: "iTransId",
    createFields: {
      iBookingTransId: "int",
      ratedByUserMasterId: "int",
      ratedToUserMasterId: "int",
      ratingType: "enum",
      rating: "decimal",
      review: "string",
    },
    searchableFields: ["ratingType", "review"],
    permissions: {
      view: permissionCodes.BOOKINGS_VIEW,
      create: permissionCodes.BOOKINGS_CREATE,
      update: permissionCodes.BOOKINGS_UPDATE,
      delete: permissionCodes.BOOKINGS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/payments",
  createCrudRouter({
    tag: "Payment",
    model: "tPayments",
    idField: "iTransId",
    createFields: {
      iBookingTransId: "int",
      paidByUserMasterId: "int",
      provider: "enum",
      providerPaymentId: "string",
      providerOrderId: "string",
      amount: "decimal",
      currency: "string",
      status: "enum",
      paymentMethod: "string",
      rawResponse: "json",
      paidAt: "date",
    },
    searchableFields: ["provider", "providerPaymentId", "providerOrderId", "status"],
    permissions: {
      view: permissionCodes.PAYMENTS_VIEW,
      create: permissionCodes.PAYMENTS_CREATE,
      update: permissionCodes.PAYMENTS_UPDATE,
      delete: permissionCodes.PAYMENTS_DELETE,
    },
  }),
);

architectureRouter.use(
  "/payment-webhooks",
  createCrudRouter({
    tag: "Payment Webhook",
    model: "tPaymentWebhooks",
    idField: "iTransId",
    createFields: {
      iPaymentTransId: "int",
      provider: "enum",
      eventType: "string",
      payload: "json",
      receivedAt: "date",
      processedAt: "date",
      processingStatus: "string",
      errorMessage: "string",
    },
    searchableFields: ["provider", "eventType", "processingStatus", "errorMessage"],
    permissions: {
      view: permissionCodes.PAYMENTS_VIEW,
      create: permissionCodes.PAYMENTS_CREATE,
      update: permissionCodes.PAYMENTS_UPDATE,
      delete: permissionCodes.PAYMENTS_DELETE,
    },
  }),
);

export default architectureRouter;
