-- Safely rename mUsers primary key without changing existing values.
ALTER TABLE `musers` CHANGE COLUMN `id` `iMasterId` INTEGER NOT NULL AUTO_INCREMENT;
-- CreateTable
CREATE TABLE `mUserAddresses` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iUserMasterId` INTEGER NOT NULL,
    `addressType` ENUM('HOME', 'WORK', 'OTHER') NOT NULL DEFAULT 'HOME',
    `addressLine1` VARCHAR(191) NOT NULL,
    `addressLine2` VARCHAR(191) NULL,
    `landmark` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mUserAddresses_iUserMasterId_idx`(`iUserMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mHeroProfiles` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iUserMasterId` INTEGER NOT NULL,
    `heroCode` VARCHAR(191) NULL,
    `governmentIdNumber` VARCHAR(191) NULL,
    `skillSummary` VARCHAR(191) NULL,
    `averageRating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    `totalRatings` INTEGER NOT NULL DEFAULT 0,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mHeroProfiles_iUserMasterId_key`(`iUserMasterId`),
    UNIQUE INDEX `mHeroProfiles_heroCode_key`(`heroCode`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mCustomerProfiles` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iUserMasterId` INTEGER NOT NULL,
    `customerCode` VARCHAR(191) NULL,
    `averageRating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    `totalRatings` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mCustomerProfiles_iUserMasterId_key`(`iUserMasterId`),
    UNIQUE INDEX `mCustomerProfiles_customerCode_key`(`customerCode`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mEmployeeProfiles` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iUserMasterId` INTEGER NOT NULL,
    `employeeCode` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mEmployeeProfiles_iUserMasterId_key`(`iUserMasterId`),
    UNIQUE INDEX `mEmployeeProfiles_employeeCode_key`(`employeeCode`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mServiceCategories` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mServiceCategories_sCode_key`(`sCode`),
    UNIQUE INDEX `mServiceCategories_sName_key`(`sName`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mServiceTypes` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mServiceTypes_sCode_key`(`sCode`),
    UNIQUE INDEX `mServiceTypes_sName_key`(`sName`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mServices` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iServiceCategoryMasterId` INTEGER NOT NULL,
    `iServiceTypeMasterId` INTEGER NOT NULL,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `shortDescription` VARCHAR(191) NULL,
    `basePrice` DECIMAL(10, 2) NOT NULL,
    `salePrice` DECIMAL(10, 2) NULL,
    `taxPercentage` DECIMAL(5, 2) NULL,
    `estimatedDurationMinutes` INTEGER NOT NULL,
    `minQuantity` INTEGER NOT NULL DEFAULT 1,
    `maxQuantity` INTEGER NULL,
    `isSlotRequired` BOOLEAN NOT NULL DEFAULT true,
    `isSubscriptionEligible` BOOLEAN NOT NULL DEFAULT false,
    `requiresBeforeImage` BOOLEAN NOT NULL DEFAULT false,
    `requiresAfterImage` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mServices_sCode_key`(`sCode`),
    UNIQUE INDEX `mServices_sName_key`(`sName`),
    INDEX `mServices_iServiceCategoryMasterId_idx`(`iServiceCategoryMasterId`),
    INDEX `mServices_iServiceTypeMasterId_idx`(`iServiceTypeMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mServiceSlots` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iServiceMasterId` INTEGER NULL,
    `slotName` VARCHAR(191) NOT NULL,
    `startTime` TIME(0) NOT NULL,
    `endTime` TIME(0) NOT NULL,
    `maxBookings` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mServiceSlots_iServiceMasterId_idx`(`iServiceMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mServiceImages` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iServiceMasterId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `imageType` ENUM('THUMBNAIL', 'BANNER', 'GALLERY') NOT NULL DEFAULT 'GALLERY',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mServiceImages_iServiceMasterId_idx`(`iServiceMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mSubscriptionTypes` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `durationDays` INTEGER NOT NULL,
    `discountPercent` DECIMAL(5, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mSubscriptionTypes_sCode_key`(`sCode`),
    UNIQUE INDEX `mSubscriptionTypes_sName_key`(`sName`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mSubscriptions` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iSubscriptionTypeMasterId` INTEGER NOT NULL,
    `iCustomerUserMasterId` INTEGER NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED') NOT NULL DEFAULT 'ACTIVE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mSubscriptions_iSubscriptionTypeMasterId_idx`(`iSubscriptionTypeMasterId`),
    INDEX `mSubscriptions_iCustomerUserMasterId_idx`(`iCustomerUserMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mCoupons` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `discountType` ENUM('PERCENTAGE', 'FLAT') NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `maxDiscountAmount` DECIMAL(10, 2) NULL,
    `minOrderAmount` DECIMAL(10, 2) NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `usageLimit` INTEGER NULL,
    `perUserLimit` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mCoupons_sCode_key`(`sCode`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mCouponServiceMappings` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iCouponMasterId` INTEGER NOT NULL,
    `iServiceMasterId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mCouponServiceMappings_iServiceMasterId_idx`(`iServiceMasterId`),
    UNIQUE INDEX `mCouponServiceMappings_iCouponMasterId_iServiceMasterId_key`(`iCouponMasterId`, `iServiceMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mHeroServiceMappings` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iHeroUserMasterId` INTEGER NOT NULL,
    `iServiceMasterId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mHeroServiceMappings_iServiceMasterId_idx`(`iServiceMasterId`),
    UNIQUE INDEX `mHeroServiceMappings_iHeroUserMasterId_iServiceMasterId_key`(`iHeroUserMasterId`, `iServiceMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mHeroServiceAreas` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iHeroUserMasterId` INTEGER NOT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `radiusKm` DECIMAL(8, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mHeroServiceAreas_iHeroUserMasterId_idx`(`iHeroUserMasterId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tBookings` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingNo` VARCHAR(191) NOT NULL,
    `iCustomerUserMasterId` INTEGER NOT NULL,
    `iServiceMasterId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `iAddressMasterId` INTEGER NULL,
    `serviceAddressSnapshot` JSON NULL,
    `iSlotMasterId` INTEGER NULL,
    `scheduledStartAt` DATETIME(3) NULL,
    `scheduledEndAt` DATETIME(3) NULL,
    `iSubscriptionMasterId` INTEGER NULL,
    `iCouponMasterId` INTEGER NULL,
    `couponCode` VARCHAR(191) NULL,
    `baseAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `finalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paymentStatus` ENUM('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `bookingStatus` ENUM('DRAFT', 'PENDING_PAYMENT', 'PAID', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tBookings_bookingNo_key`(`bookingNo`),
    INDEX `tBookings_iCustomerUserMasterId_idx`(`iCustomerUserMasterId`),
    INDEX `tBookings_iServiceMasterId_idx`(`iServiceMasterId`),
    INDEX `tBookings_iAddressMasterId_idx`(`iAddressMasterId`),
    INDEX `tBookings_iSlotMasterId_idx`(`iSlotMasterId`),
    INDEX `tBookings_iSubscriptionMasterId_idx`(`iSubscriptionMasterId`),
    INDEX `tBookings_iCouponMasterId_idx`(`iCouponMasterId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tBookingAssignments` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `iHeroUserMasterId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `status` ENUM('ASSIGNED', 'ACCEPTED', 'REJECTED', 'STARTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tBookingAssignments_iBookingTransId_idx`(`iBookingTransId`),
    INDEX `tBookingAssignments_iHeroUserMasterId_idx`(`iHeroUserMasterId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tBookingImages` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `imageType` ENUM('BEFORE_SERVICE', 'AFTER_SERVICE', 'ISSUE', 'OTHER') NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `uploadedByUserMasterId` INTEGER NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tBookingImages_iBookingTransId_idx`(`iBookingTransId`),
    INDEX `tBookingImages_uploadedByUserMasterId_idx`(`uploadedByUserMasterId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tBookingRatings` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `ratedByUserMasterId` INTEGER NOT NULL,
    `ratedToUserMasterId` INTEGER NOT NULL,
    `ratingType` ENUM('CUSTOMER_TO_HERO', 'HERO_TO_CUSTOMER') NOT NULL,
    `rating` DECIMAL(3, 2) NOT NULL,
    `review` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tBookingRatings_ratedByUserMasterId_idx`(`ratedByUserMasterId`),
    INDEX `tBookingRatings_ratedToUserMasterId_idx`(`ratedToUserMasterId`),
    UNIQUE INDEX `tBookingRatings_iBookingTransId_ratingType_ratedByUserMaster_key`(`iBookingTransId`, `ratingType`, `ratedByUserMasterId`, `ratedToUserMasterId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tPayments` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `paidByUserMasterId` INTEGER NULL,
    `provider` ENUM('ZOHO', 'MANUAL', 'PLACEHOLDER') NOT NULL DEFAULT 'PLACEHOLDER',
    `providerPaymentId` VARCHAR(191) NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` VARCHAR(191) NULL,
    `rawResponse` JSON NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tPayments_iBookingTransId_idx`(`iBookingTransId`),
    INDEX `tPayments_paidByUserMasterId_idx`(`paidByUserMasterId`),
    INDEX `tPayments_providerPaymentId_idx`(`providerPaymentId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tPaymentWebhooks` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iPaymentTransId` INTEGER NULL,
    `provider` ENUM('ZOHO', 'MANUAL', 'PLACEHOLDER') NOT NULL DEFAULT 'PLACEHOLDER',
    `eventType` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processingStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,

    INDEX `tPaymentWebhooks_iPaymentTransId_idx`(`iPaymentTransId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mUserAddresses` ADD CONSTRAINT `mUserAddresses_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mHeroProfiles` ADD CONSTRAINT `mHeroProfiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mCustomerProfiles` ADD CONSTRAINT `mCustomerProfiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mEmployeeProfiles` ADD CONSTRAINT `mEmployeeProfiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mServices` ADD CONSTRAINT `mServices_iServiceCategoryMasterId_fkey` FOREIGN KEY (`iServiceCategoryMasterId`) REFERENCES `mServiceCategories`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mServices` ADD CONSTRAINT `mServices_iServiceTypeMasterId_fkey` FOREIGN KEY (`iServiceTypeMasterId`) REFERENCES `mServiceTypes`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mServiceSlots` ADD CONSTRAINT `mServiceSlots_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mServiceImages` ADD CONSTRAINT `mServiceImages_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mSubscriptions` ADD CONSTRAINT `mSubscriptions_iSubscriptionTypeMasterId_fkey` FOREIGN KEY (`iSubscriptionTypeMasterId`) REFERENCES `mSubscriptionTypes`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mSubscriptions` ADD CONSTRAINT `mSubscriptions_iCustomerUserMasterId_fkey` FOREIGN KEY (`iCustomerUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mCouponServiceMappings` ADD CONSTRAINT `mCouponServiceMappings_iCouponMasterId_fkey` FOREIGN KEY (`iCouponMasterId`) REFERENCES `mCoupons`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mCouponServiceMappings` ADD CONSTRAINT `mCouponServiceMappings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mHeroServiceMappings` ADD CONSTRAINT `mHeroServiceMappings_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mHeroServiceMappings` ADD CONSTRAINT `mHeroServiceMappings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mHeroServiceAreas` ADD CONSTRAINT `mHeroServiceAreas_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iCustomerUserMasterId_fkey` FOREIGN KEY (`iCustomerUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iAddressMasterId_fkey` FOREIGN KEY (`iAddressMasterId`) REFERENCES `mUserAddresses`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iSlotMasterId_fkey` FOREIGN KEY (`iSlotMasterId`) REFERENCES `mServiceSlots`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iSubscriptionMasterId_fkey` FOREIGN KEY (`iSubscriptionMasterId`) REFERENCES `mSubscriptions`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iCouponMasterId_fkey` FOREIGN KEY (`iCouponMasterId`) REFERENCES `mCoupons`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingAssignments` ADD CONSTRAINT `tBookingAssignments_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tBookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingAssignments` ADD CONSTRAINT `tBookingAssignments_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingImages` ADD CONSTRAINT `tBookingImages_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tBookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingImages` ADD CONSTRAINT `tBookingImages_uploadedByUserMasterId_fkey` FOREIGN KEY (`uploadedByUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingRatings` ADD CONSTRAINT `tBookingRatings_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tBookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingRatings` ADD CONSTRAINT `tBookingRatings_ratedByUserMasterId_fkey` FOREIGN KEY (`ratedByUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tBookingRatings` ADD CONSTRAINT `tBookingRatings_ratedToUserMasterId_fkey` FOREIGN KEY (`ratedToUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tPayments` ADD CONSTRAINT `tPayments_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tBookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tPayments` ADD CONSTRAINT `tPayments_paidByUserMasterId_fkey` FOREIGN KEY (`paidByUserMasterId`) REFERENCES `mUsers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tPaymentWebhooks` ADD CONSTRAINT `tPaymentWebhooks_iPaymentTransId_fkey` FOREIGN KEY (`iPaymentTransId`) REFERENCES `tPayments`(`iTransId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Move legacy single-line user addresses into the new address table before dropping the old column.
INSERT INTO `mUserAddresses` (`iUserMasterId`, `addressType`, `addressLine1`, `isDefault`, `isActive`, `createdAt`, `updatedAt`)
SELECT `iMasterId`, 'HOME', `address`, true, true, `createdAt`, `updatedAt`
FROM `musers`
WHERE `address` IS NOT NULL AND TRIM(`address`) <> '';

ALTER TABLE `musers` DROP COLUMN `address`;
