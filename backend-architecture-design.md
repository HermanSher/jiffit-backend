# Jiffit Backend Architecture Design

This document describes the recommended backend architecture for the next stage of the Jiffit backend. It is based on the current project in `jiffit-backend`, including the existing Express + TypeScript + Prisma + MySQL stack, current APIs, current response format, and current naming conventions.

## Current Baseline

Current stack:
- Node.js
- Express
- TypeScript
- Prisma
- MySQL
- Swagger

Current response format:

```json
{
  "result": 1,
  "message": "Success message",
  "data": {}
}
```

Current source structure:

```text
src/
  controllers/
  routes/
  services/
  lib/prisma.ts
  utils/
  docs/swagger.ts
  index.ts
```

Recommendation: keep this structure for now. It is simple, predictable, and already matches the current codebase. When modules grow larger, move toward feature folders such as `src/modules/bookings`, but that is not required yet.

## Naming Rules

Master tables:
- Prefix: `m`
- Primary key: `iMasterId`
- Examples: `mUsers`, `mRoles`, `mServices`

Transaction tables:
- Prefix: `t`
- Primary key: `iTransId`
- Examples: `tBookings`, `tPayments`

Common naming:
- `sCode` for stable code values.
- `sName` for display names.
- `isActive` for active/inactive master records.
- `createdAt` and `updatedAt` on all important tables.

## Required Prisma Datasource Fix

The Prisma datasource should explicitly read from `DATABASE_URL`.

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## Core User Architecture

Keep one common `mUsers` table for all user identities:
- Employee
- Hero
- Customer

Do not create separate login tables for hero, customer, or employee. Authentication should always resolve through `mUsers`.

### Recommended Enums

```prisma
enum EmploymentStatus {
  ACTIVE
  LEFT
}

enum UserAddressType {
  HOME
  WORK
  OTHER
}

enum BookingStatus {
  DRAFT
  PENDING_PAYMENT
  PAID
  ASSIGNMENT_PENDING
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  FAILED
}

enum BookingAssignmentStatus {
  ASSIGNED
  ACCEPTED
  REJECTED
  STARTED
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  PAID
  FAILED
  REFUNDED
  CANCELLED
}

enum PaymentProvider {
  ZOHO
  MANUAL
  PLACEHOLDER
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PAUSED
}

enum BookingImageType {
  BEFORE_SERVICE
  AFTER_SERVICE
  ISSUE
  OTHER
}

enum BookingRatingType {
  CUSTOMER_TO_HERO
  HERO_TO_CUSTOMER
}

enum DiscountType {
  PERCENTAGE
  FLAT
}

enum ServiceImageType {
  THUMBNAIL
  BANNER
  GALLERY
}
```

## Recommended Prisma Schema Direction

This is a design target, not an immediate migration file.

### mUsers

Changes:
- Rename primary key from `id` to `iMasterId`.
- Remove direct `address`.
- Keep login and common identity fields here.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `username String @unique`
- `firstName String?`
- `middleName String?`
- `lastName String?`
- `mobileNo String?`
- `alternateNumber String?`
- `email String? @unique`
- `password String`
- `iRoleMasterId Int?`
- `iUserTypeMasterId Int?`
- `employmentStatus EmploymentStatus @default(ACTIVE)`
- `joinedAt DateTime @default(now())`
- `leftAt DateTime?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `role -> mRoles`
- `userType -> mUserTypes`
- `addresses -> mUserAddresses[]`
- `heroProfile -> mHeroProfiles?`
- `customerProfile -> mCustomerProfiles?`
- `employeeProfile -> mEmployeeProfiles?`

### mUserAddresses

Purpose: store one or more addresses/locations for any user type.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `iUserMasterId Int`
- `sName String?`
- `addressLine1 String`
- `addressLine2 String?`
- `landmark String?`
- `city String?`
- `state String?`
- `country String?`
- `postalCode String?`
- `latitude Decimal? @db.Decimal(10, 7)`
- `longitude Decimal? @db.Decimal(10, 7)`
- `addressType UserAddressType @default(HOME)`
- `isDefault Boolean @default(false)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `user -> mUsers`
- `bookings -> tBookings[]` as customer booking address reference.

### mHeroProfiles

Purpose: hero-specific operational details.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `iUserMasterId Int @unique`
- `verificationStatus String?`
- `rating Decimal? @db.Decimal(3, 2)`
- `totalJobsCompleted Int @default(0)`
- `isAvailable Boolean @default(false)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `user -> mUsers`
- `serviceMappings -> mHeroServiceMappings[]`
- `serviceAreas -> mHeroServiceAreas[]`
- `assignments -> tBookingAssignments[]`

### mCustomerProfiles

Purpose: customer-specific profile information.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `iUserMasterId Int @unique`
- `customerCode String? @unique`
- `defaultAddressMasterId Int?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `user -> mUsers`
- `bookings -> tBookings[]`
- `subscriptions -> mSubscriptions[]`

### mEmployeeProfiles

Purpose: optional employee-only metadata.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `iUserMasterId Int @unique`
- `employeeCode String? @unique`
- `department String?`
- `designation String?`
- `reportingManagerUserId Int?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Use this only if employee metadata grows beyond `mUsers`.

## Role and User Type Masters

### mRoles

Current direction is good.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String @unique`
- `precedence Int @unique`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Rules:
- `SU` must always have `precedence = 1`.
- `precedence = 1` is reserved for `SU`.

### mUserTypes

Purpose: classify users as `EMPLOYEE`, `HERO`, `CUSTOMER`, etc.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String @unique`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Suggested seed values:
- `EMPLOYEE`
- `HERO`
- `CUSTOMER`

## Booking Architecture

### mServiceCategories

Purpose: group services.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String @unique`
- `description String?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `services -> mServices[]`

### mServiceTypes

Purpose: classify services for filtering, assignment, and dashboard management.

Recommended columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String @unique`
- `description String?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Example seed values:
- `CLEANING`
- `REPAIR`
- `INSTALLATION`
- `MAINTENANCE`
- `WASHING`

Relations:
- `services -> mServices[]`

### mServices

Purpose: bookable service master. Admin/company users should be able to create and manage these services from the dashboard.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iServiceCategoryMasterId Int`
- `iServiceTypeMasterId Int`
- `sCode String @unique`
- `sName String @unique`
- `description String?`
- `shortDescription String?`
- `basePrice Decimal? @db.Decimal(10, 2)`
- `salePrice Decimal? @db.Decimal(10, 2)`
- `taxPercentage Decimal? @db.Decimal(5, 2)`
- `estimatedDurationMinutes Int?`
- `minQuantity Int @default(1)`
- `maxQuantity Int?`
- `isSlotRequired Boolean @default(true)`
- `isSubscriptionEligible Boolean @default(false)`
- `requiresBeforeImage Boolean @default(false)`
- `requiresAfterImage Boolean @default(false)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `category -> mServiceCategories`
- `serviceType -> mServiceTypes`
- `heroMappings -> mHeroServiceMappings[]`
- `bookings -> tBookings[]`
- `subscriptions -> mSubscriptions[]`
- `slots -> mServiceSlots[]`
- `images -> mServiceImages[]`
- `couponMappings -> mCouponServiceMappings[]`

Pricing rule:
- Use `salePrice` when available, otherwise `basePrice`.
- `finalAmount = (servicePrice * quantity) - discountAmount + taxAmount`.

### mServiceSlots

Purpose: define bookable service slots for UI and capacity management.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iServiceMasterId Int?`
- `slotName String`
- `startTime String`
- `endTime String`
- `maxBookings Int?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `service -> mServices?`
- `bookings -> tBookings[]`

Notes:
- `iServiceMasterId` is nullable so a slot can be global or service-specific.
- Store `startTime` and `endTime` as time strings such as `09:00` and `10:00` unless the project later standardizes on MySQL `TIME`.
- UI can show slots like `09:00 AM - 10:00 AM`, `10:00 AM - 11:00 AM`, `02:00 PM - 03:00 PM`.
- Later capacity check: count active bookings for the same service/date/slot and compare against `maxBookings`.

### mServiceImages

Purpose: service listing/detail media managed by admin.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iServiceMasterId Int`
- `imageUrl String`
- `imageType ServiceImageType`
- `displayOrder Int @default(0)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `service -> mServices`

Image types:
- `THUMBNAIL`
- `BANNER`
- `GALLERY`

### mSubscriptionTypes

Purpose: subscription plan definitions.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String @unique`
- `description String?`
- `durationDays Int`
- `allowedBookings Int?`
- `price Decimal @db.Decimal(10, 2)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `subscriptions -> mSubscriptions[]`

### mSubscriptions

Purpose: customer subscription records.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iCustomerUserMasterId Int`
- `iSubscriptionTypeMasterId Int`
- `iServiceMasterId Int?`
- `startAt DateTime`
- `endAt DateTime`
- `status SubscriptionStatus @default(ACTIVE)`
- `remainingBookings Int?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `customer -> mUsers`
- `subscriptionType -> mSubscriptionTypes`
- `service -> mServices?`
- `bookings -> tBookings[]`

### mCoupons

Purpose: coupon and discount master. Coupons may apply globally or only to selected services.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `sCode String @unique`
- `sName String`
- `description String?`
- `discountType DiscountType`
- `discountValue Decimal @db.Decimal(10, 2)`
- `maxDiscountAmount Decimal? @db.Decimal(10, 2)`
- `minOrderAmount Decimal? @db.Decimal(10, 2)`
- `startAt DateTime`
- `endAt DateTime`
- `usageLimit Int?`
- `perUserLimit Int?`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `serviceMappings -> mCouponServiceMappings[]`
- `bookings -> tBookings[]`

### mCouponServiceMappings

Purpose: restrict coupons to selected services when needed.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iCouponMasterId Int`
- `iServiceMasterId Int`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Constraints:
- Unique pair: `(iCouponMasterId, iServiceMasterId)`

Relations:
- `coupon -> mCoupons`
- `service -> mServices`

### mHeroServiceMappings

Purpose: define which heroes can perform which services.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iHeroUserMasterId Int`
- `iServiceMasterId Int`
- `isPrimary Boolean @default(false)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Constraints:
- Unique pair: `(iHeroUserMasterId, iServiceMasterId)`

Relations:
- `hero -> mUsers`
- `service -> mServices`

### mHeroServiceAreas

Purpose: define where heroes can serve.

Columns:
- `iMasterId Int @id @default(autoincrement())`
- `iHeroUserMasterId Int`
- `city String?`
- `state String?`
- `postalCode String?`
- `latitude Decimal? @db.Decimal(10, 7)`
- `longitude Decimal? @db.Decimal(10, 7)`
- `radiusKm Decimal? @db.Decimal(8, 2)`
- `isActive Boolean @default(true)`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `hero -> mUsers`

### tBookings

Purpose: customer booking transaction.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `bookingNo String @unique`
- `iCustomerUserMasterId Int`
- `iServiceMasterId Int`
- `iCustomerAddressMasterId Int?`
- `iSubscriptionMasterId Int?`
- `iSlotMasterId Int?`
- `iCouponMasterId Int?`
- `couponCode String?`
- `quantity Int @default(1)`
- `scheduledStartAt DateTime`
- `scheduledEndAt DateTime?`
- `actualStartAt DateTime?`
- `actualEndAt DateTime?`
- `customerLatitude Decimal? @db.Decimal(10, 7)`
- `customerLongitude Decimal? @db.Decimal(10, 7)`
- `serviceAmount Decimal? @db.Decimal(10, 2)`
- `discountAmount Decimal? @db.Decimal(10, 2)`
- `taxAmount Decimal? @db.Decimal(10, 2)`
- `totalAmount Decimal? @db.Decimal(10, 2)`
- `bookingStatus BookingStatus @default(PENDING_PAYMENT)`
- `paymentStatus PaymentStatus @default(PENDING)`
- `customerNotes String?`
- `internalNotes String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `customer -> mUsers`
- `service -> mServices`
- `address -> mUserAddresses?`
- `subscription -> mSubscriptions?`
- `slot -> mServiceSlots?`
- `coupon -> mCoupons?`
- `assignments -> tBookingAssignments[]`
- `payments -> tPayments[]`
- `images -> tBookingImages[]`
- `ratings -> tBookingRatings[]`

Booking support:
- customer booking service
- quantity
- selected slot
- booking date/time
- customer address/location
- coupon/discount
- payment status
- booking status
- optional subscription
- later hero assignment based on service type and location

Pricing rule:
- `servicePrice = salePrice ?? basePrice`
- `serviceAmount = servicePrice * quantity`
- `totalAmount = serviceAmount - discountAmount + taxAmount`
- Keep `couponCode` as a snapshot because coupon code text can change later.

### tBookingAssignments

Purpose: assign a hero to a booking, with assignment lifecycle.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `iBookingTransId Int`
- `iHeroUserMasterId Int`
- `assignmentStatus BookingAssignmentStatus @default(ASSIGNED)`
- `assignedAt DateTime @default(now())`
- `acceptedAt DateTime?`
- `rejectedAt DateTime?`
- `startedAt DateTime?`
- `completedAt DateTime?`
- `cancelledAt DateTime?`
- `notes String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Constraints:
- Unique active assignment logic should be handled in service layer initially.

Relations:
- `booking -> tBookings`
- `hero -> mUsers`

### tBookingImages

Purpose: store multiple images for a booking before service, after service, issues, or other cases.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `iBookingTransId Int`
- `imageType BookingImageType`
- `imageUrl String`
- `uploadedByUserMasterId Int?`
- `remarks String?`
- `createdAt DateTime @default(now())`

Relations:
- `booking -> tBookings`
- `uploadedBy -> mUsers?`

Reason:
- One booking may have multiple before and after images.
- Do not store single `beforeServiceImage` and `afterServiceImage` columns directly on `tBookings`.

### tBookingRatings

Purpose: store ratings separately for customer-to-hero and hero-to-customer feedback.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `iBookingTransId Int`
- `ratedByUserMasterId Int`
- `ratedToUserMasterId Int`
- `ratingType BookingRatingType`
- `rating Decimal @db.Decimal(3, 2)`
- `review String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Constraints:
- Unique pair recommendation: `(iBookingTransId, ratedByUserMasterId, ratedToUserMasterId, ratingType)`

Relations:
- `booking -> tBookings`
- `ratedBy -> mUsers`
- `ratedTo -> mUsers`

Optional summary fields:
- `mHeroProfiles.averageRating Decimal? @db.Decimal(3, 2)`
- `mHeroProfiles.totalRatings Int @default(0)`
- `mCustomerProfiles.averageRating Decimal? @db.Decimal(3, 2)`
- `mCustomerProfiles.totalRatings Int @default(0)`

### tPayments

Purpose: payment transaction placeholder that can support Zoho later.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `iBookingTransId Int?`
- `iSubscriptionMasterId Int?`
- `provider PaymentProvider @default(PLACEHOLDER)`
- `providerPaymentId String?`
- `providerOrderId String?`
- `amount Decimal @db.Decimal(10, 2)`
- `currency String @default("INR")`
- `paymentStatus PaymentStatus @default(PENDING)`
- `paidAt DateTime?`
- `failureReason String?`
- `rawProviderResponse Json?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`

Relations:
- `booking -> tBookings?`
- `subscription -> mSubscriptions?`
- `webhooks -> tPaymentWebhooks[]`

### tPaymentWebhooks

Purpose: raw provider webhook audit table.

Columns:
- `iTransId Int @id @default(autoincrement())`
- `iPaymentTransId Int?`
- `provider PaymentProvider @default(PLACEHOLDER)`
- `eventType String?`
- `providerEventId String?`
- `payload Json`
- `processedAt DateTime?`
- `processingStatus String?`
- `processingError String?`
- `createdAt DateTime @default(now())`

Relations:
- `payment -> tPayments?`

## Endpoint Plan

Keep the existing modules and add new modules incrementally.

### Existing APIs to Keep

Auth:
- `POST /api/auth/login`

Roles:
- Existing `/api/roles` APIs.

User Types:
- Existing `/api/user-types` APIs.

Users:
- Existing `/api/users` APIs.

### User Address APIs

- `POST /api/users/:iUserMasterId/addresses`
- `GET /api/users/:iUserMasterId/addresses`
- `GET /api/user-addresses/:iMasterId`
- `PATCH /api/user-addresses/:iMasterId`
- `DELETE /api/user-addresses/:iMasterId`
- `PATCH /api/user-addresses/:iMasterId/default`

### Profile APIs

Hero profiles:
- `POST /api/heroes/:iUserMasterId/profile`
- `GET /api/heroes/:iUserMasterId/profile`
- `PATCH /api/heroes/:iUserMasterId/profile`

Customer profiles:
- `POST /api/customers/:iUserMasterId/profile`
- `GET /api/customers/:iUserMasterId/profile`
- `PATCH /api/customers/:iUserMasterId/profile`

Employee profiles:
- `POST /api/employees/:iUserMasterId/profile`
- `GET /api/employees/:iUserMasterId/profile`
- `PATCH /api/employees/:iUserMasterId/profile`

### Service Catalog APIs

Service categories:
- `POST /api/service-categories`
- `GET /api/service-categories`
- `GET /api/service-categories/:iMasterId`
- `PATCH /api/service-categories/:iMasterId`
- `DELETE /api/service-categories/:iMasterId`

Service types:
- `POST /api/service-types`
- `GET /api/service-types`
- `GET /api/service-types/:iMasterId`
- `PATCH /api/service-types/:iMasterId`
- `DELETE /api/service-types/:iMasterId`

Services:
- `POST /api/services`
- `GET /api/services`
- `GET /api/services/:iMasterId`
- `PATCH /api/services/:iMasterId`
- `DELETE /api/services/:iMasterId`
- `GET /api/service-categories/:iMasterId/services`
- `GET /api/service-types/:iMasterId/services`

Service slots:
- `POST /api/service-slots`
- `GET /api/service-slots`
- `GET /api/service-slots/:iMasterId`
- `PATCH /api/service-slots/:iMasterId`
- `DELETE /api/service-slots/:iMasterId`
- `GET /api/services/:iMasterId/slots`

Service images:
- `POST /api/services/:iServiceMasterId/images`
- `GET /api/services/:iServiceMasterId/images`
- `PATCH /api/service-images/:iMasterId`
- `DELETE /api/service-images/:iMasterId`

Coupons:
- `POST /api/coupons`
- `GET /api/coupons`
- `GET /api/coupons/:iMasterId`
- `PATCH /api/coupons/:iMasterId`
- `DELETE /api/coupons/:iMasterId`
- `POST /api/coupons/:iCouponMasterId/services`
- `GET /api/coupons/:iCouponMasterId/services`
- `DELETE /api/coupons/:iCouponMasterId/services/:iServiceMasterId`
- `POST /api/coupons/validate`

### Subscription APIs

Subscription types:
- `POST /api/subscription-types`
- `GET /api/subscription-types`
- `GET /api/subscription-types/:iMasterId`
- `PATCH /api/subscription-types/:iMasterId`
- `DELETE /api/subscription-types/:iMasterId`

Subscriptions:
- `POST /api/subscriptions`
- `GET /api/subscriptions`
- `GET /api/subscriptions/:iMasterId`
- `PATCH /api/subscriptions/:iMasterId`
- `PATCH /api/subscriptions/:iMasterId/cancel`
- `GET /api/customers/:iUserMasterId/subscriptions`

### Hero Capability APIs

Hero service mappings:
- `POST /api/heroes/:iHeroUserMasterId/services`
- `GET /api/heroes/:iHeroUserMasterId/services`
- `DELETE /api/heroes/:iHeroUserMasterId/services/:iServiceMasterId`

Hero service areas:
- `POST /api/heroes/:iHeroUserMasterId/service-areas`
- `GET /api/heroes/:iHeroUserMasterId/service-areas`
- `PATCH /api/hero-service-areas/:iMasterId`
- `DELETE /api/hero-service-areas/:iMasterId`

### Booking APIs

- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:iTransId`
- `PATCH /api/bookings/:iTransId`
- `PATCH /api/bookings/:iTransId/cancel`
- `GET /api/customers/:iCustomerUserMasterId/bookings`
- `GET /api/bookings/:iTransId/eligible-heroes`
- `GET /api/bookings/slot-availability`
- `POST /api/bookings/:iTransId/assignments`
- `PATCH /api/booking-assignments/:iTransId/accept`
- `PATCH /api/booking-assignments/:iTransId/reject`
- `PATCH /api/booking-assignments/:iTransId/start`
- `PATCH /api/booking-assignments/:iTransId/complete`

Booking images:
- `POST /api/bookings/:iBookingTransId/images`
- `GET /api/bookings/:iBookingTransId/images`
- `DELETE /api/booking-images/:iTransId`

Booking ratings:
- `POST /api/bookings/:iBookingTransId/ratings`
- `GET /api/bookings/:iBookingTransId/ratings`
- `GET /api/users/:iUserMasterId/ratings`

### Payment APIs

Initial placeholder:
- `POST /api/payments/initiate`
- `GET /api/payments/:iTransId`
- `PATCH /api/payments/:iTransId/status`
- `POST /api/payments/webhooks/placeholder`

Future Zoho:
- `POST /api/payments/zoho/initiate`
- `POST /api/payments/webhooks/zoho`

## Suggested Module Structure

Keep the current flat folders for consistency:

```text
src/
  controllers/
    auth.controller.ts
    role.controller.ts
    user-type.controller.ts
    user.controller.ts
    user-address.controller.ts
    hero-profile.controller.ts
    customer-profile.controller.ts
    employee-profile.controller.ts
    service-category.controller.ts
    service.controller.ts
    subscription-type.controller.ts
    subscription.controller.ts
    hero-service.controller.ts
    booking.controller.ts
    payment.controller.ts
  routes/
    auth.routes.ts
    role.routes.ts
    user-type.routes.ts
    user.routes.ts
    user-address.routes.ts
    hero-profile.routes.ts
    customer-profile.routes.ts
    employee-profile.routes.ts
    service-category.routes.ts
    service.routes.ts
    subscription-type.routes.ts
    subscription.routes.ts
    hero-service.routes.ts
    booking.routes.ts
    payment.routes.ts
  services/
    auth.service.ts
    role.service.ts
    user-type.service.ts
    user.service.ts
    user-address.service.ts
    hero-profile.service.ts
    customer-profile.service.ts
    employee-profile.service.ts
    service-category.service.ts
    service.service.ts
    subscription-type.service.ts
    subscription.service.ts
    hero-service.service.ts
    booking.service.ts
    payment.service.ts
```

If the backend grows significantly, the next improvement would be:

```text
src/modules/
  users/
  bookings/
  payments/
  services/
```

For now, do not change structure unless there is a strong reason.

## Migration Steps

Recommended migration order:

1. Fix Prisma datasource.
2. Rename `mUsers.id` to `mUsers.iMasterId`.
3. Update all foreign references from user `id` to `iUserMasterId` style names.
4. Remove `mUsers.address`.
5. Create `mUserAddresses`.
6. Create profile tables:
   - `mHeroProfiles`
   - `mCustomerProfiles`
   - `mEmployeeProfiles`
7. Add service catalog tables:
   - `mServiceCategories`
   - `mServiceTypes`
   - `mServices`
   - `mServiceSlots`
   - `mServiceImages`
8. Add subscription tables:
   - `mSubscriptionTypes`
   - `mSubscriptions`
9. Add coupon tables:
   - `mCoupons`
   - `mCouponServiceMappings`
10. Add hero capability tables:
   - `mHeroServiceMappings`
   - `mHeroServiceAreas`
11. Add booking transaction tables:
   - `tBookings`
   - `tBookingAssignments`
   - `tBookingImages`
   - `tBookingRatings`
12. Add payment placeholder tables:
   - `tPayments`
   - `tPaymentWebhooks`
13. Update Swagger documentation after each module.
14. Run `prisma generate`, `prisma migrate`, and backend build after every migration group.

## Existing Code to Safely Refactor

### Prisma Schema

Safe refactors:
- Add datasource `url = env("DATABASE_URL")`.
- Rename `mUsers.id` to `iMasterId`.
- Remove `mUsers.address`.
- Add new models incrementally.

High attention areas:
- Any controller/service parsing `req.params.id`.
- Any service using `user.id`.
- Auth response currently returns `id`; frontend may expect this. Either preserve API field `id` as an alias in response or update frontend to use `iMasterId`.

### User Service

Refactor:
- Replace direct `id` usages with `iMasterId`.
- Move address creation/list/update to a new `user-address.service.ts`.
- Keep SU safety rules in `user.service.ts`.
- Add shared user lookup helpers by `iMasterId`, username, role, and user type.

### Auth Service

Refactor:
- Return `iMasterId` internally.
- Optionally keep `id` in login response temporarily for frontend compatibility.
- Later replace plain password comparison with password hashing.
- Later replace generated session string with JWT or server-side session.

### Role Service

Keep:
- Precedence validation.
- SU precedence rule.

Consider:
- Do not allow deleting a role assigned to users.
- Keep `SU` role protected from accidental deletion.

### Swagger

Current Swagger is a single large `src/docs/swagger.ts`. This is acceptable now, but it will become heavy.

Future option:
- Split Swagger docs by module and compose them into one `swaggerSpec`.

## Booking Flow Design

Initial booking flow:

1. Customer selects service.
2. Customer selects quantity.
3. Customer selects slot/date.
4. Customer selects address or sends location.
5. Customer optionally applies coupon.
6. Backend calculates:
   - `serviceAmount = servicePrice * quantity`
   - `discountAmount`
   - `taxAmount`
   - `totalAmount`
7. Backend checks slot capacity if `iSlotMasterId` and `maxBookings` are present.
8. Backend creates `tBookings` with:
   - `bookingStatus = PENDING_PAYMENT`
   - `paymentStatus = PENDING`
9. Payment is initiated through placeholder payment service.
10. Payment success updates:
   - `tPayments.paymentStatus = PAID`
   - `tBookings.paymentStatus = PAID`
   - `tBookings.bookingStatus = ASSIGNMENT_PENDING`
11. Eligible heroes are found using:
   - `mHeroServiceMappings`
   - `mHeroServiceAreas`
   - hero availability from `mHeroProfiles`
12. Admin/system assigns hero through `tBookingAssignments`.
13. Booking status moves through assigned, in progress, completed, or cancelled.
14. Before/after/issue images are stored in `tBookingImages`.
15. Customer and hero ratings are stored in `tBookingRatings`.

Final booking capabilities:
- selected service
- quantity
- selected slot
- selected address/location
- coupon/discount
- payment
- before service images
- after service images
- customer rating
- hero rating
- assignment lifecycle

## Payment Provider Placeholder

Payment architecture should support Zoho later without locking the app to Zoho now.

Current placeholder design:
- `tPayments.provider = PLACEHOLDER`
- Store external IDs as nullable fields.
- Store raw provider response in `rawProviderResponse`.
- Store all incoming webhook payloads in `tPaymentWebhooks`.

When Zoho is added:
- Add Zoho initiate logic in `payment.service.ts`.
- Add Zoho webhook verification.
- Normalize Zoho payment states into `PaymentStatus`.

## Recommended Next Implementation Order

1. User primary key rename and address extraction.
2. Profile tables.
3. Service catalog tables and APIs.
4. Service type, slot, image, and coupon APIs.
5. Hero service mapping and service area APIs.
6. Booking create/list/detail APIs.
7. Booking slot availability and coupon validation.
8. Booking hero eligibility API.
9. Booking assignment APIs.
10. Booking images and ratings APIs.
11. Payment placeholder APIs.
12. Swagger split or cleanup.
13. Password hashing and real auth token middleware.
14. Replace all physical delete behavior with soft delete and restore flows.

## Compatibility Notes

Because the current frontend likely consumes:
- `user.id`
- `/api/users/:id`
- login response `user.id`

Migration should either:
- keep API response aliases temporarily, or
- update frontend in the same branch.

Recommended transitional approach:
- Database uses `iMasterId`.
- API can return both `iMasterId` and `id` for one release.
- Frontend migrates to `iMasterId`.
- Remove `id` alias later.

## Soft Delete Strategy

All resources that expose DELETE APIs should use soft delete instead of physical deletion.

Current meaning:
- `isActive = false` means inactive, disabled, or hidden from regular workflows, but still usable in admin/audit cases.
- `isDeleted = true` means logically deleted and hidden from normal frontend lists.

Recommended soft-delete columns for every deletable master and transaction table:

```prisma
isActive              Boolean   @default(true)
isDeleted             Boolean   @default(false)
deletedAt             DateTime?
deletedByUserMasterId Int?
```

`deletedByUserMasterId` should point to `mUsers.iMasterId` when auth middleware exists. Until then it can remain nullable.

### Tables That Need Soft Delete Columns

Master tables:
- `mRoles`
- `mUserTypes`
- `mUsers`
- `mUserAddresses`
- `mHeroProfiles`
- `mCustomerProfiles`
- `mEmployeeProfiles`
- `mServiceCategories`
- `mServiceTypes`
- `mServices`
- `mServiceSlots`
- `mServiceImages`
- `mSubscriptionTypes`
- `mSubscriptions`
- `mCoupons`
- `mCouponServiceMappings`
- `mHeroServiceMappings`
- `mHeroServiceAreas`

Transaction tables:
- `tBookings`
- `tBookingAssignments`
- `tBookingImages`
- `tBookingRatings`
- `tPayments`
- `tPaymentWebhooks`

### DELETE API Behavior

DELETE APIs should not call `prisma.<model>.delete()` or `deleteMany()` for business data.

Target behavior:

```ts
{
  isDeleted: true,
  isActive: false,
  deletedAt: new Date(),
  deletedByUserMasterId: currentLoggedInUserId ?? null
}
```

Until auth middleware exists, `deletedByUserMasterId` should remain nullable.

Examples:
- `DELETE /api/services/:iMasterId` means soft delete service by setting `isDeleted = true`, `isActive = false`, `deletedAt = now`.
- `DELETE /api/users/:iMasterId` means soft delete user by setting `isDeleted = true`, `isActive = false`, `employmentStatus = LEFT` if appropriate.
- `DELETE /api/bookings/:iTransId` means admin-only accidental cleanup, not customer cancellation.

### GET/List API Behavior

Normal list APIs should always filter:

```ts
where: {
  isDeleted: false
}
```

Detail APIs should also not return deleted records unless an admin explicitly requests deleted records.

Admin-only query support planned:

```http
?includeDeleted=true
```

Rules:
- Normal frontend screens should not pass `includeDeleted=true`.
- Only admin/SU should be allowed to use `includeDeleted=true` after auth/RBAC middleware is added.
- Until auth/RBAC exists, implementation should either ignore `includeDeleted=true` or treat it as internal/admin-only with caution.

### Restore APIs

Restore APIs should update soft-delete fields back to active state:

```ts
{
  isDeleted: false,
  deletedAt: null,
  deletedByUserMasterId: null,
  isActive: true
}
```

Important restore endpoints to add:

| Method | Path | Purpose | Status |
|---|---|---|---|
| `PATCH` | `/api/roles/:iMasterId/restore` | Restore soft-deleted role. | Planned |
| `PATCH` | `/api/user-types/:iMasterId/restore` | Restore soft-deleted user type. | Planned |
| `PATCH` | `/api/users/:iMasterId/restore` | Restore soft-deleted user. | Planned |
| `PATCH` | `/api/services/:iMasterId/restore` | Restore soft-deleted service. | Planned |
| `PATCH` | `/api/service-categories/:iMasterId/restore` | Restore soft-deleted service category. | Planned |
| `PATCH` | `/api/service-types/:iMasterId/restore` | Restore soft-deleted service type. | Planned |
| `PATCH` | `/api/coupons/:iMasterId/restore` | Restore soft-deleted coupon. | Planned |
| `PATCH` | `/api/bookings/:iTransId/restore` | Restore accidentally soft-deleted booking; admin-only. | Planned |

### Soft Delete Business Rules

- Do not allow soft deleting the last active SU user.
- Do not allow soft deleting the `SU` role.
- Do not allow soft deleting roles assigned to non-deleted users unless a separate force-disable/admin workflow is intentionally implemented.
- Do not allow soft deleting user types assigned to non-deleted users unless a separate force-disable/admin workflow is intentionally implemented.
- For bookings, prefer cancellation flow over delete. `DELETE /api/bookings/:iTransId` should be admin-only accidental cleanup.
- Payments and payment webhooks should generally not be deleted. If delete API exists, it should be admin-only soft delete/audit only.
- Soft-deleted records should be excluded from normal assignment, login, booking, payment, and selection workflows.
- Restore should not bypass uniqueness or referential integrity checks.

### Uniqueness and Soft Delete

Soft-deleted records remain in the database, so unique fields still block duplicate values.

Examples:
- `mRoles.sCode`
- `mRoles.sName`
- `mUserTypes.sCode`
- `mUserTypes.sName`
- `mUsers.username`
- `mUsers.email`
- `mServiceCategories.sCode`
- `mServiceCategories.sName`
- `mServiceTypes.sCode`
- `mServiceTypes.sName`
- `mServices.sCode`
- `mServices.sName`
- `mCoupons.sCode`

For now, keep unique constraints as-is for safety.

Future options if the business requires reusing deleted codes:
- Restore deleted records instead of recreating them.
- Add a composite uniqueness strategy that includes `isDeleted` or an archival key.
- Move deleted records to historical/archive tables only after audit requirements are clear.

### Soft Delete Refactor Plan

1. Add soft-delete columns to all listed tables.
2. Update all list/detail queries to filter `isDeleted = false` by default.
3. Add `includeDeleted=true` parsing for admin/SU usage later.
4. Replace all `delete()` and `deleteMany()` calls with `update()` or `updateMany()`.
5. Add restore endpoints for important masters and bookings.
6. Update Swagger to describe DELETE as soft delete.
7. Add tests for SU safety, assigned role/user type safety, and hidden soft-deleted rows.

## Current API Inventory and Purpose

This section reflects the backend implementation currently present in `src/index.ts`, `src/routes`, `src/controllers`, `src/services`, `src/utils`, `src/docs/swagger.ts`, and `prisma/schema.prisma`.

Important soft-delete planning note:
- DELETE routes currently exist in code.
- Target behavior is soft delete, not physical database deletion.
- Any row below mentioning DELETE should be treated as "soft delete after refactor".
- Current code still needs refactoring where it calls Prisma `delete()` or `deleteMany()`.

### Shared Response Format

Most JSON APIs use this response envelope through `sendSuccess` and `sendError` in `src/utils/error-handler.ts`:

```json
{
  "result": 1,
  "message": "Operation message.",
  "data": {}
}
```

Error responses generally use:

```json
{
  "result": -1,
  "message": "Error message.",
  "data": null
}
```

Exceptions:
- `GET /health` includes `status`, `timestamp`, and `uptimeSeconds` at the top level instead of under `data`.
- `GET /api-docs.json` returns the raw Swagger/OpenAPI object.
- `GET /api-docs` returns Swagger UI HTML/static assets.

### Base APIs

| Method | Path | File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/` | `src/index.ts` | Inline route handler | None | Basic API running check. | None. | Always returns `{ result: 1, message: "API running...", data: null }`. | Ready |
| `GET` | `/health` | `src/index.ts` | Inline route handler | None | Runtime health check. | None. | Returns uptime and timestamp; response format is not fully aligned with standard `{ result, message, data }`. | Ready, minor response-format refactor |
| Any | Unmatched route | `src/index.ts` | Inline 404 handler | None | Catch-all route-not-found response. | Any unmatched path. | Must stay after all mounted routers. | Ready |

### Swagger APIs

| Method | Path | File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `GET` | `/api-docs.json` | `src/index.ts`, `src/docs/swagger.ts` | Inline route handler | None | Returns raw Swagger/OpenAPI spec. | None. | Does not use `{ result, message, data }`. | Ready, docs need ongoing sync |
| `GET` | `/api-docs` | `src/index.ts`, `src/docs/swagger.ts` | `swaggerUi.setup(swaggerSpec)` middleware | None | Swagger UI browser documentation. | None. | Mounted with `swaggerUi.serve`. | Ready, docs need ongoing sync |

### Auth APIs

| Method | Path | Route File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/auth/login` | `src/routes/auth.routes.ts` | `login` in `src/controllers/auth.controller.ts` | `authService.login` in `src/services/auth.service.ts` | Login with username and password. | Body: `username`, `password`. | Body allows only `username` and `password`; password is compared as plain text; user must exist, `isActive = true`, and `employmentStatus = ACTIVE`; token is generated with `randomBytes`, timestamp, and user id, but is not persisted or verified later. | Partial, needs password hashing and real session/JWT strategy |

### Role APIs

Base route mounted in `src/index.ts`: `app.use("/api/roles", roleRouter)`.

| Method | Path | Route File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/roles` | `src/routes/role.routes.ts` | `createRole` | `roleService.createRole` | Create role master record. | Body: `sCode`, `sName`, `precedence`, optional `isActive`. | `SU` must always have `precedence = 1`; non-`SU` roles cannot use precedence `1`; duplicate unique fields return duplicate error. | Ready |
| `GET` | `/api/roles` | `src/routes/role.routes.ts` | `getRoles` | `roleService.getRoles` | List roles with filters. | Query: `sCode`, `sName` or `name`, `precedence`, `isActive`. | Results ordered by `precedence`, then `iMasterId`. No pagination. | Ready, needs pagination later |
| `GET` | `/api/roles/by-sname/:sName` | `src/routes/role.routes.ts` | `getRoleBySName` | `roleService.getRoleBySName` | Get one role by display/name field. | Param: `sName`. | Returns `404` when not found. | Ready |
| `DELETE` | `/api/roles/bulk` | `src/routes/role.routes.ts` | `deleteRolesByIds` | `roleService.deleteRolesByIds` | Soft delete multiple roles. | Body: `rolesId` or `roleIds` integer array. | All ids must exist; cannot soft delete roles assigned to non-deleted users; must never soft delete `SU`. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `PATCH` | `/api/roles/by-scode/:sCode` | `src/routes/role.routes.ts` | `updateRoleBySCode` | `roleService.updateRoleBySCode`, then `roleService.updateRoleById` | Update role by code. | Param: `sCode`; body can include `sCode`, `sName`, `precedence`, `isActive`. | At least one allowed field required; SU precedence policy enforced. | Ready |
| `DELETE` | `/api/roles/by-scode/:sCode` | `src/routes/role.routes.ts` | `deleteRoleBySCode` | `roleService.deleteRoleBySCode` | Soft delete role by code. | Param: `sCode`. | Must not soft delete `SU`; must not soft delete roles assigned to non-deleted users unless force workflow exists. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `GET` | `/api/roles/:iMasterId/users` | `src/routes/role.routes.ts` | `getUsersByRoleId` | `roleService.getUsersByRoleId` | List users assigned to a role. | Param: `iMasterId`. | Role must exist. | Ready |
| `GET` | `/api/roles/sname/:sName/users` | `src/routes/role.routes.ts` | `getUsersByRoleSName` | `roleService.getUsersByRoleSName` | List users assigned to a role by role `sName`. | Param: `sName`. | Role must exist. | Ready |
| `PATCH` | `/api/roles/:iMasterId` | `src/routes/role.routes.ts` | `updateRoleById` | `roleService.updateRoleById` | Update role by id. | Param: `iMasterId`; body can include `sCode`, `sName`, `precedence`, `isActive`. | At least one allowed field required; SU precedence policy enforced. | Ready |
| `DELETE` | `/api/roles/:iMasterId` | `src/routes/role.routes.ts` | `deleteRoleById` | `roleService.deleteRoleById` | Soft delete role by id. | Param: `iMasterId`. | Must not soft delete `SU`; must not soft delete roles assigned to non-deleted users unless force workflow exists. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `GET` | `/api/roles/:iMasterId` | `src/routes/role.routes.ts` | `getRoleById` | `roleService.getRoleById` | Get one role by id. | Param: `iMasterId`. | Returns `404` when not found. | Ready |

### User Type APIs

Base route mounted in `src/index.ts`: `app.use("/api/user-types", userTypeRouter)`.

| Method | Path | Route File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/user-types` | `src/routes/user-type.routes.ts` | `createUserType` | `userTypeService.createUserType` | Create user type master record. | Body: `sCode`, `sName`, optional `isActive`. | Unique `sCode` and `sName`. | Ready |
| `GET` | `/api/user-types` | `src/routes/user-type.routes.ts` | `getUserTypes` | `userTypeService.getUserTypes` | List user types with filters. | Query: `sCode`, `sName` or `name`, `isActive`. | Ordered by `iMasterId`. No pagination. | Ready, needs pagination later |
| `GET` | `/api/user-types/by-sname/:sName` | `src/routes/user-type.routes.ts` | `getUserTypeBySName` | `userTypeService.getUserTypeBySName` | Get one user type by `sName`. | Param: `sName`. | Returns `404` when not found. | Ready |
| `DELETE` | `/api/user-types/bulk` | `src/routes/user-type.routes.ts` | `deleteUserTypesByIds` | `userTypeService.deleteUserTypesByIds` | Soft delete multiple user types. | Body: `userTypesId` or `userTypeIds` integer array. | All ids must exist; cannot soft delete user types assigned to non-deleted users unless force workflow exists. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `PATCH` | `/api/user-types/by-scode/:sCode` | `src/routes/user-type.routes.ts` | `updateUserTypeBySCode` | `userTypeService.updateUserTypeBySCode` | Update user type by code. | Param: `sCode`; body can include `sCode`, `sName`, `isActive`. | At least one allowed field required. | Ready |
| `DELETE` | `/api/user-types/by-scode/:sCode` | `src/routes/user-type.routes.ts` | `deleteUserTypeBySCode` | `userTypeService.deleteUserTypeBySCode` | Soft delete user type by code. | Param: `sCode`. | Must not soft delete user types assigned to non-deleted users unless force workflow exists. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `GET` | `/api/user-types/:iMasterId/users` | `src/routes/user-type.routes.ts` | `getUsersByUserTypeId` | `userTypeService.getUsersByUserTypeId` | List users assigned to a user type. | Param: `iMasterId`. | User type must exist. | Ready |
| `GET` | `/api/user-types/sname/:sName/users` | `src/routes/user-type.routes.ts` | `getUsersByUserTypeSName` | `userTypeService.getUsersByUserTypeSName` | List users assigned to a user type by `sName`. | Param: `sName`. | User type must exist. | Ready |
| `PATCH` | `/api/user-types/:iMasterId` | `src/routes/user-type.routes.ts` | `updateUserTypeById` | `userTypeService.updateUserTypeById` | Update user type by id. | Param: `iMasterId`; body can include `sCode`, `sName`, `isActive`. | At least one allowed field required. | Ready |
| `DELETE` | `/api/user-types/:iMasterId` | `src/routes/user-type.routes.ts` | `deleteUserTypeById` | `userTypeService.deleteUserTypeById` | Soft delete user type by id. | Param: `iMasterId`. | Must not soft delete user types assigned to non-deleted users unless force workflow exists. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `GET` | `/api/user-types/:iMasterId` | `src/routes/user-type.routes.ts` | `getUserTypeById` | `userTypeService.getUserTypeById` | Get one user type by id. | Param: `iMasterId`. | Returns `404` when not found. | Ready |

### User APIs

Base route mounted in `src/index.ts`: `app.use("/api/users", userRouter)`.

| Method | Path | Route File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/users` | `src/routes/user.routes.ts` | `createUser` | `userService.createUser` | Create a user in common `mUsers`. | Body: `username`, `password`, `iRoleMasterId`, `iUserTypeMasterId`, `createdByUserId`; optional `firstName`, `middleName`, `lastName`, `address`, `mobileNo`, `alternateNumber`, `email`, `isActive`. | Creator must exist and be active SU; role and user type must exist; optional legacy `address` is stored in `mUserAddresses`; password stored plain text. | Partial, needs password hashing and auth middleware |
| `GET` | `/api/users` | `src/routes/user.routes.ts` | `getUsers` | `userService.getUsers` | List users with filters. | Query: `id`, `username`, `firstName`, `middleName`, `lastName`, `address`, `mobileNo`, `alternateNumber`, `email`, `iRoleMasterId` or `roleId`, `iUserTypeMasterId` or `userTypeId`, `sRoleName` or `roleName`, `sUserTypeName` or `userTypeName`, `isActive`, `employmentStatus`, `createdFrom` or `fromDate`, `createdTo` or `toDate`. | `employmentStatus` must be `ACTIVE` or `LEFT`; `createdFrom` must be before/equal `createdTo`; API returns `id` alias for `iMasterId` for frontend compatibility. No pagination. | Ready, needs pagination and clearer ID naming |
| `GET` | `/api/users/by-username/:username` | `src/routes/user.routes.ts` | `getUserByUsername` | `userService.getUserByUsername` | Get user by username. | Param: `username`. | Returns `404` when not found. | Ready |
| `GET` | `/api/users/by-role/:iMasterId` | `src/routes/user.routes.ts` | `getUsersByRoleId` | `userService.getUsersByRoleId` | List users by role id. | Param: `iMasterId`. | Uses user filtering by `iRoleMasterId`; does not explicitly verify role exists in this path. | Ready, minor consistency refactor |
| `GET` | `/api/users/by-role-sname/:sName` | `src/routes/user.routes.ts` | `getUsersByRoleSName` | `userService.getUsersByRoleSName` | List users by role `sName`. | Param: `sName`. | Uses role relation filter by `sName`. | Ready |
| `GET` | `/api/users/by-user-type/:iMasterId` | `src/routes/user.routes.ts` | `getUsersByUserTypeId` | `userService.getUsersByUserTypeId` | List users by user type id. | Param: `iMasterId`. | Uses user filtering by `iUserTypeMasterId`; does not explicitly verify user type exists in this path. | Ready, minor consistency refactor |
| `GET` | `/api/users/by-user-type-sname/:sName` | `src/routes/user.routes.ts` | `getUsersByUserTypeSName` | `userService.getUsersByUserTypeSName` | List users by user type `sName`. | Param: `sName`. | Uses user type relation filter by `sName`. | Ready |
| `PATCH` | `/api/users/:id/leave` | `src/routes/user.routes.ts` | `markUserLeftById` | `userService.markUserLeftById` | Mark user as left/inactive by id. | Param: `id`; optional body `leftAt`. | At least one active SU must remain; sets `employmentStatus = LEFT`, `isActive = false`, and `leftAt`. | Ready |
| `PATCH` | `/api/users/by-username/:username/leave` | `src/routes/user.routes.ts` | `markUserLeftByUsername` | `userService.markUserLeftByUsername` | Mark user as left/inactive by username. | Param: `username`; optional body `leftAt`. | At least one active SU must remain; sets `employmentStatus = LEFT`, `isActive = false`, and `leftAt`. | Ready |
| `PATCH` | `/api/users/:id/rejoin` | `src/routes/user.routes.ts` | `rejoinUserById` | `userService.rejoinUserById` | Re-activate left user by id. | Param: `id`; empty body only. | Sets `employmentStatus = ACTIVE`, `isActive = true`, `leftAt = null`. | Ready |
| `PATCH` | `/api/users/by-username/:username/rejoin` | `src/routes/user.routes.ts` | `rejoinUserByUsername` | `userService.rejoinUserByUsername` | Re-activate left user by username. | Param: `username`; empty body only. | Sets `employmentStatus = ACTIVE`, `isActive = true`, `leftAt = null`. | Ready |
| `DELETE` | `/api/users/bulk` | `src/routes/user.routes.ts` | `deleteUsersByIds` | `userService.deleteUsersByIds` | Soft delete multiple users. | Body: `usersId` or `userIds` integer array. | All ids must exist; at least one active SU must remain; should set `isDeleted = true`, `isActive = false`. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `DELETE` | `/api/users/by-username/:username` | `src/routes/user.routes.ts` | `deleteUserByUsername` | `userService.deleteUserByUsername` | Soft delete user by username. | Param: `username`. | At least one active SU must remain; should set `isDeleted = true`, `isActive = false`. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `DELETE` | `/api/users/:id` | `src/routes/user.routes.ts` | `deleteUserById` | `userService.deleteUserById` | Soft delete user by id. | Param: `id`. | At least one active SU must remain; should set `isDeleted = true`, `isActive = false`. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |
| `GET` | `/api/users/:id` | `src/routes/user.routes.ts` | `getUserById` | `userService.getUserById` | Get user by id. | Param: `id`. | Uses `mUsers.iMasterId` internally and returns `id` alias. | Ready |

### Architecture Prototype APIs

The following APIs are currently mounted by `src/index.ts` through `app.use("/api", architectureRouter)` and defined in `src/routes/architecture.routes.ts`.

Most of these use the generic `createCrudRouter` in `src/routes/crud-router.ts`, not separate controller/service files.

Generic CRUD behavior:
- `POST /api/<resource>` creates a record.
- `GET /api/<resource>` lists records with simple field filters.
- `GET /api/<resource>/:id` gets one record.
- `PATCH /api/<resource>/:id` updates one record.
- `DELETE /api/<resource>/:id` should soft delete one record after refactor.
- Handler file: `src/routes/crud-router.ts`.
- Controller function: none; inline handlers inside `createCrudRouter`.
- Service function: none; direct Prisma delegate calls through `getDelegate`.
- Response format: uses `sendSuccess` and `handleControllerError`.
- Important business rules: generic parser validates primitive types only; no module-specific business authorization, pagination, or lifecycle checks.
- Status: Partial/prototype. Useful for admin setup and early testing, but should be refactored into dedicated controller/service modules for production logic and soft-delete behavior.

| Resource Base Path | Prisma Model | Primary Key | Methods / Paths | Purpose | Fields Accepted By Generic Router | Status |
|---|---|---|---|---|---|---|
| `/api/user-addresses` | `mUserAddresses` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage multiple addresses per user. | `iUserMasterId`, `addressType`, `addressLine1`, `addressLine2`, `landmark`, `city`, `state`, `pincode`, `latitude`, `longitude`, `isDefault`, `isActive`. | Partial/prototype |
| `/api/hero-profiles` | `mHeroProfiles` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage hero profile details. | `iUserMasterId`, `heroCode`, `governmentIdNumber`, `skillSummary`, `averageRating`, `totalRatings`, `isAvailable`. | Partial/prototype |
| `/api/customer-profiles` | `mCustomerProfiles` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage customer profile details. | `iUserMasterId`, `customerCode`, `averageRating`, `totalRatings`. | Partial/prototype |
| `/api/employee-profiles` | `mEmployeeProfiles` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage employee profile details. | `iUserMasterId`, `employeeCode`, `designation`, `department`. | Partial/prototype |
| `/api/service-categories` | `mServiceCategories` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage service categories. | `sCode`, `sName`, `description`, `displayOrder`, `isActive`. | Partial/prototype |
| `/api/service-types` | `mServiceTypes` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage service type master data. | `sCode`, `sName`, `description`, `isActive`. | Partial/prototype |
| `/api/services` | `mServices` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage admin-created services. | `iServiceCategoryMasterId`, `iServiceTypeMasterId`, `sCode`, `sName`, `description`, `shortDescription`, `basePrice`, `salePrice`, `taxPercentage`, `estimatedDurationMinutes`, `minQuantity`, `maxQuantity`, `isSlotRequired`, `isSubscriptionEligible`, `requiresBeforeImage`, `requiresAfterImage`, `isActive`. | Partial/prototype |
| `/api/service-slots` | `mServiceSlots` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage service/global booking slots. | `iServiceMasterId`, `slotName`, `startTime`, `endTime`, `maxBookings`, `isActive`. | Partial/prototype |
| `/api/service-images` | `mServiceImages` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage service listing/detail images. | `iServiceMasterId`, `imageUrl`, `imageType`, `displayOrder`, `isActive`. | Partial/prototype |
| `/api/subscription-types` | `mSubscriptionTypes` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage subscription plans/types. | `sCode`, `sName`, `description`, `durationDays`, `discountPercent`, `isActive`. | Partial/prototype |
| `/api/subscriptions` | `mSubscriptions` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage customer subscriptions. | `iSubscriptionTypeMasterId`, `iCustomerUserMasterId`, `startAt`, `endAt`, `status`, `isActive`. | Partial/prototype |
| `/api/coupons` | `mCoupons` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage coupons and discount rules. | `sCode`, `sName`, `description`, `discountType`, `discountValue`, `maxDiscountAmount`, `minOrderAmount`, `startAt`, `endAt`, `usageLimit`, `perUserLimit`, `isActive`. | Partial/prototype |
| `/api/coupon-service-mappings` | `mCouponServiceMappings` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Map coupons to selected services. | `iCouponMasterId`, `iServiceMasterId`, `isActive`. | Partial/prototype |
| `/api/hero-service-mappings` | `mHeroServiceMappings` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Map heroes to services they can perform. | `iHeroUserMasterId`, `iServiceMasterId`, `isActive`. | Partial/prototype |
| `/api/hero-service-areas` | `mHeroServiceAreas` | `iMasterId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage hero service coverage locations. | `iHeroUserMasterId`, `city`, `state`, `pincode`, `latitude`, `longitude`, `radiusKm`, `isActive`. | Partial/prototype |
| `/api/booking-assignments` | `tBookingAssignments` | `iTransId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage assignment rows between bookings and heroes. | `iBookingTransId`, `iHeroUserMasterId`, `assignedAt`, `acceptedAt`, `startedAt`, `completedAt`, `status`, `remarks`. | Partial/prototype |
| `/api/booking-images` | `tBookingImages` | `iTransId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage before/after/issue booking images. | `iBookingTransId`, `imageType`, `imageUrl`, `uploadedByUserMasterId`, `remarks`. | Partial/prototype |
| `/api/booking-ratings` | `tBookingRatings` | `iTransId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage customer-to-hero and hero-to-customer ratings. | `iBookingTransId`, `ratedByUserMasterId`, `ratedToUserMasterId`, `ratingType`, `rating`, `review`. | Partial/prototype |
| `/api/payments` | `tPayments` | `iTransId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Manage payment placeholder records. | `iBookingTransId`, `paidByUserMasterId`, `provider`, `providerPaymentId`, `providerOrderId`, `amount`, `currency`, `status`, `paymentMethod`, `rawResponse`, `paidAt`. | Partial/prototype |
| `/api/payment-webhooks` | `tPaymentWebhooks` | `iTransId` | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Store provider webhook payloads. | `iPaymentTransId`, `provider`, `eventType`, `payload`, `receivedAt`, `processedAt`, `processingStatus`, `errorMessage`. | Partial/prototype |

### Booking APIs

Base route mounted by `architectureRouter.use("/bookings", bookingRouter)`.

These routes are currently implemented directly in `src/routes/booking.routes.ts`; there is no separate booking controller or service file yet.

| Method | Path | Route File | Controller Function | Service Function | Purpose | Params / Body / Query | Business Rules | Status |
|---|---|---|---|---|---|---|---|---|
| `POST` | `/api/bookings` | `src/routes/booking.routes.ts` | Inline route handler | Inline helper functions `resolveCoupon`, `parseRequiredPositiveInt`, `toNumber`, `money` | Create booking with quantity, optional slot, address, subscription, coupon, and calculated amounts. | Body required: `iCustomerUserMasterId`, `iServiceMasterId`; optional `bookingNo`, `quantity`, `iAddressMasterId`, `serviceAddressSnapshot`, `iSlotMasterId`, `scheduledStartAt`, `scheduledEndAt`, `iSubscriptionMasterId`, `iCouponMasterId`, `couponCode`, `remarks`. | Active service must exist; quantity must be within service `minQuantity`/`maxQuantity`; coupon must be active by date, meet min order, and match mapped service when mappings exist; calculates `baseAmount`, `discountAmount`, `taxAmount`, `finalAmount`; sets `paymentStatus = PENDING` and `bookingStatus = PENDING_PAYMENT`. | Partial, needs controller/service split, auth, customer/service type validation, slot capacity validation |
| `GET` | `/api/bookings` | `src/routes/booking.routes.ts` | Inline route handler | None | List bookings with included service/customer/slot/coupon/assignments/payments/images/ratings. | Query: `iCustomerUserMasterId`, `iServiceMasterId`, `bookingStatus`, `paymentStatus`. | Ordered by `iTransId desc`; no pagination. | Partial |
| `GET` | `/api/bookings/:id` | `src/routes/booking.routes.ts` | Inline route handler | None | Get one booking with related details. | Param: `id` mapped to `tBookings.iTransId`. | Returns `404` when not found. | Partial |
| `PATCH` | `/api/bookings/:id` | `src/routes/booking.routes.ts` | Inline route handler | None | Update booking scheduling/status fields. | Param: `id`; body can include `paymentStatus`, `bookingStatus`, `scheduledStartAt`, `scheduledEndAt`, `iSlotMasterId`, `remarks`. | At least one allowed field required. Does not enforce lifecycle transitions. | Partial, needs lifecycle rules |
| `DELETE` | `/api/bookings/:id` | `src/routes/booking.routes.ts` | Inline route handler | None | Soft delete booking for admin accidental cleanup. | Param: `id`. | Should set `isDeleted = true`, `isActive = false`; customer/user cancellation should use a cancellation workflow, not DELETE. Current code needs refactor because it physically deletes. | Needs soft-delete refactor |

## Current Backend Gaps / Refactor Notes

- Prisma datasource: `prisma/schema.prisma` currently has `datasource db { provider = "mysql" }` without `url`. This is correct for this installed Prisma 7 setup because `prisma.config.ts` provides `datasource.url`; however, the architecture text that asks for `url = env("DATABASE_URL")` should be treated as Prisma 6-style guidance and not blindly applied unless Prisma version changes.
- `mUsers` primary key is now `iMasterId` in `prisma/schema.prisma`; user APIs still expose an `id` alias for dashboard compatibility. Swagger user schema still emphasizes `id`, so docs should be updated to show both `iMasterId` and compatibility `id`.
- Direct `address` was removed from `mUsers`; `userService.createUser` still accepts legacy body field `address` and writes it into `mUserAddresses`. This is useful compatibility, but future APIs should prefer explicit address objects.
- Password handling is not production-ready: `authService.login` compares plain text passwords and `userService.createUser` stores plain text passwords.
- Login token is generated locally from user id, timestamp, and random bytes, but is not persisted, signed as JWT, expired, or validated by middleware.
- No auth middleware exists. All APIs, including admin-style role/user/service/coupon/booking APIs, are publicly callable if the server is reachable.
- No RBAC middleware exists. SU checks exist only in selected user creation/deletion/lifecycle rules and role precedence rules.
- Zod is present in `src/utils/request-parsers.ts`, but validation is partial. Existing controllers validate allowed/required fields and primitive parsing; generic architecture CRUD routes validate primitive types only and do not have full schema-level validation, enum validation, cross-field validation, or business validation.
- Pagination is missing across list endpoints. `GET /api/users`, role/user-type lists, generic CRUD lists, and booking lists can grow unbounded.
- Response format is mostly consistent through `sendSuccess`/`sendError`, but `/health`, `/api-docs.json`, and `/api-docs` are exceptions.
- Error logging is missing in `handleControllerError`; unexpected server errors return generic `Internal server error.` without logging the actual error.
- Generic CRUD APIs directly call Prisma from `src/routes/crud-router.ts`; these should be refactored into dedicated controller/service modules before production so booking/service/customer/hero business rules are not bypassed.
- Booking APIs are currently implemented inline in `src/routes/booking.routes.ts`; they should be moved into `booking.controller.ts` and `booking.service.ts`.
- Booking lifecycle rules are incomplete: no valid transition enforcement, no cancellation workflow, no assignment acceptance/rejection rules, no hero availability checks, and no slot capacity checks.
- Coupon usage limits are defined in schema but not enforced yet in booking creation.
- Payment provider architecture exists, but Zoho integration is still placeholder; webhook verification and idempotency are not implemented.
- Delete endpoints currently physically delete records in many places. Replace all Prisma `delete()` and `deleteMany()` usage with soft-delete updates using `isDeleted`, `isActive`, `deletedAt`, and `deletedByUserMasterId`.
- Role and user type single delete APIs do not apply the same assigned-user guard as their bulk delete APIs. This should be aligned.
- Swagger is partially updated. New architecture routes are documented generically, but request/response schemas are not detailed enough for frontend/backend contract work.
- Some route/controller/service logic is duplicated between role and user type modules, especially bulk delete existence checks and assigned-user guards.
