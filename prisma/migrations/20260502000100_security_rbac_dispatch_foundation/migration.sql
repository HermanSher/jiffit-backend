-- DropForeignKey
ALTER TABLE `mcouponservicemappings` DROP FOREIGN KEY `mCouponServiceMappings_iCouponMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mcouponservicemappings` DROP FOREIGN KEY `mCouponServiceMappings_iServiceMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mcustomerprofiles` DROP FOREIGN KEY `mCustomerProfiles_iUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `memployeeprofiles` DROP FOREIGN KEY `mEmployeeProfiles_iUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mheroprofiles` DROP FOREIGN KEY `mHeroProfiles_iUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mheroserviceareas` DROP FOREIGN KEY `mHeroServiceAreas_iHeroUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mheroservicemappings` DROP FOREIGN KEY `mHeroServiceMappings_iHeroUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mheroservicemappings` DROP FOREIGN KEY `mHeroServiceMappings_iServiceMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mserviceimages` DROP FOREIGN KEY `mServiceImages_iServiceMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mservices` DROP FOREIGN KEY `mServices_iServiceCategoryMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mservices` DROP FOREIGN KEY `mServices_iServiceTypeMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `mserviceslots` DROP FOREIGN KEY `mServiceSlots_iServiceMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `msubscriptions` DROP FOREIGN KEY `mSubscriptions_iCustomerUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `msubscriptions` DROP FOREIGN KEY `mSubscriptions_iSubscriptionTypeMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `museraddresses` DROP FOREIGN KEY `mUserAddresses_iUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `musers` DROP FOREIGN KEY `mUsers_iRoleMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `musers` DROP FOREIGN KEY `mUsers_iUserTypeMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingassignments` DROP FOREIGN KEY `tBookingAssignments_iBookingTransId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingassignments` DROP FOREIGN KEY `tBookingAssignments_iHeroUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingimages` DROP FOREIGN KEY `tBookingImages_iBookingTransId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingimages` DROP FOREIGN KEY `tBookingImages_uploadedByUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingratings` DROP FOREIGN KEY `tBookingRatings_iBookingTransId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingratings` DROP FOREIGN KEY `tBookingRatings_ratedByUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookingratings` DROP FOREIGN KEY `tBookingRatings_ratedToUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iAddressMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iCouponMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iCustomerUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iServiceMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iSlotMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iSubscriptionMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tpayments` DROP FOREIGN KEY `tPayments_iBookingTransId_fkey`;

-- DropForeignKey
ALTER TABLE `tpayments` DROP FOREIGN KEY `tPayments_paidByUserMasterId_fkey`;

-- DropForeignKey
ALTER TABLE `tpaymentwebhooks` DROP FOREIGN KEY `tPaymentWebhooks_iPaymentTransId_fkey`;

-- AlterTable
ALTER TABLE `mheroprofiles` ADD COLUMN `workerState` ENUM('OFFLINE', 'ONLINE', 'AVAILABLE', 'ASSIGNED', 'ACCEPTED', 'TRAVELLING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE `tbookings` MODIFY `bookingStatus` ENUM('DRAFT', 'HOLD', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `refreshTokenHash` TEXT NOT NULL,
    `deviceInfo` TEXT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `auth_sessions_userId_idx`(`userId`),
    INDEX `auth_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mscreens` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `routePath` VARCHAR(191) NULL,
    `parentScreenId` INTEGER NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mscreens_sCode_key`(`sCode`),
    INDEX `mscreens_parentScreenId_idx`(`parentScreenId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mpermissions` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `sCode` VARCHAR(191) NOT NULL,
    `sName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mpermissions_sCode_key`(`sCode`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mrole_screen_permissions` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `screenId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `isAllowed` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mrole_screen_permissions_screenId_idx`(`screenId`),
    INDEX `mrole_screen_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `mrole_screen_permissions_roleId_screenId_permissionId_key`(`roleId`, `screenId`, `permissionId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `muser_screen_permissions` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `screenId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `isAllowed` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `muser_screen_permissions_screenId_idx`(`screenId`),
    INDEX `muser_screen_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `muser_screen_permissions_userId_screenId_permissionId_key`(`userId`, `screenId`, `permissionId`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tassignmentattempts` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `iHeroUserMasterId` INTEGER NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'TIMEOUT', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `timeoutAt` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tassignmentattempts_iBookingTransId_idx`(`iBookingTransId`),
    INDEX `tassignmentattempts_iHeroUserMasterId_idx`(`iHeroUserMasterId`),
    INDEX `tassignmentattempts_status_idx`(`status`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tidempotencykeys` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `requestHash` VARCHAR(191) NOT NULL,
    `responseJson` JSON NULL,
    `createdByUserMasterId` INTEGER NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tidempotencykeys_expiresAt_idx`(`expiresAt`),
    INDEX `tidempotencykeys_createdByUserMasterId_idx`(`createdByUserMasterId`),
    UNIQUE INDEX `tidempotencykeys_key_scope_key`(`key`, `scope`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbookingstatushistory` (
    `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
    `iBookingTransId` INTEGER NOT NULL,
    `fromStatus` ENUM('DRAFT', 'HOLD', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED') NULL,
    `toStatus` ENUM('DRAFT', 'HOLD', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL,
    `changedByUserMasterId` INTEGER NULL,
    `reason` TEXT NULL,
    `metadataJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tbookingstatushistory_iBookingTransId_idx`(`iBookingTransId`),
    INDEX `tbookingstatushistory_changedByUserMasterId_idx`(`changedByUserMasterId`),
    PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mdevicetokens` (
    `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
    `iUserMasterId` INTEGER NOT NULL,
    `deviceToken` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `appType` ENUM('CUSTOMER', 'HERO', 'DASHBOARD') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mdevicetokens_appType_idx`(`appType`),
    UNIQUE INDEX `mdevicetokens_iUserMasterId_deviceToken_key`(`iUserMasterId`, `deviceToken`),
    PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `musers` ADD CONSTRAINT `musers_iRoleMasterId_fkey` FOREIGN KEY (`iRoleMasterId`) REFERENCES `mroles`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `musers` ADD CONSTRAINT `musers_iUserTypeMasterId_fkey` FOREIGN KEY (`iUserTypeMasterId`) REFERENCES `musertypes`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `museraddresses` ADD CONSTRAINT `museraddresses_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mheroprofiles` ADD CONSTRAINT `mheroprofiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mcustomerprofiles` ADD CONSTRAINT `mcustomerprofiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memployeeprofiles` ADD CONSTRAINT `memployeeprofiles_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mservices` ADD CONSTRAINT `mservices_iServiceCategoryMasterId_fkey` FOREIGN KEY (`iServiceCategoryMasterId`) REFERENCES `mservicecategories`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mservices` ADD CONSTRAINT `mservices_iServiceTypeMasterId_fkey` FOREIGN KEY (`iServiceTypeMasterId`) REFERENCES `mservicetypes`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mserviceslots` ADD CONSTRAINT `mserviceslots_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mservices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mserviceimages` ADD CONSTRAINT `mserviceimages_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mservices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `msubscriptions` ADD CONSTRAINT `msubscriptions_iSubscriptionTypeMasterId_fkey` FOREIGN KEY (`iSubscriptionTypeMasterId`) REFERENCES `msubscriptiontypes`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `msubscriptions` ADD CONSTRAINT `msubscriptions_iCustomerUserMasterId_fkey` FOREIGN KEY (`iCustomerUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mcouponservicemappings` ADD CONSTRAINT `mcouponservicemappings_iCouponMasterId_fkey` FOREIGN KEY (`iCouponMasterId`) REFERENCES `mcoupons`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mcouponservicemappings` ADD CONSTRAINT `mcouponservicemappings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mservices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mheroservicemappings` ADD CONSTRAINT `mheroservicemappings_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mheroservicemappings` ADD CONSTRAINT `mheroservicemappings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mservices`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mheroserviceareas` ADD CONSTRAINT `mheroserviceareas_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iCustomerUserMasterId_fkey` FOREIGN KEY (`iCustomerUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mservices`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iAddressMasterId_fkey` FOREIGN KEY (`iAddressMasterId`) REFERENCES `museraddresses`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iSlotMasterId_fkey` FOREIGN KEY (`iSlotMasterId`) REFERENCES `mserviceslots`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iSubscriptionMasterId_fkey` FOREIGN KEY (`iSubscriptionMasterId`) REFERENCES `msubscriptions`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookings` ADD CONSTRAINT `tbookings_iCouponMasterId_fkey` FOREIGN KEY (`iCouponMasterId`) REFERENCES `mcoupons`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingassignments` ADD CONSTRAINT `tbookingassignments_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingassignments` ADD CONSTRAINT `tbookingassignments_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingimages` ADD CONSTRAINT `tbookingimages_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingimages` ADD CONSTRAINT `tbookingimages_uploadedByUserMasterId_fkey` FOREIGN KEY (`uploadedByUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingratings` ADD CONSTRAINT `tbookingratings_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingratings` ADD CONSTRAINT `tbookingratings_ratedByUserMasterId_fkey` FOREIGN KEY (`ratedByUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingratings` ADD CONSTRAINT `tbookingratings_ratedToUserMasterId_fkey` FOREIGN KEY (`ratedToUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tpayments` ADD CONSTRAINT `tpayments_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tpayments` ADD CONSTRAINT `tpayments_paidByUserMasterId_fkey` FOREIGN KEY (`paidByUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tpaymentwebhooks` ADD CONSTRAINT `tpaymentwebhooks_iPaymentTransId_fkey` FOREIGN KEY (`iPaymentTransId`) REFERENCES `tpayments`(`iTransId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mscreens` ADD CONSTRAINT `mscreens_parentScreenId_fkey` FOREIGN KEY (`parentScreenId`) REFERENCES `mscreens`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mrole_screen_permissions` ADD CONSTRAINT `mrole_screen_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `mroles`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mrole_screen_permissions` ADD CONSTRAINT `mrole_screen_permissions_screenId_fkey` FOREIGN KEY (`screenId`) REFERENCES `mscreens`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mrole_screen_permissions` ADD CONSTRAINT `mrole_screen_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `mpermissions`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `muser_screen_permissions` ADD CONSTRAINT `muser_screen_permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `muser_screen_permissions` ADD CONSTRAINT `muser_screen_permissions_screenId_fkey` FOREIGN KEY (`screenId`) REFERENCES `mscreens`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `muser_screen_permissions` ADD CONSTRAINT `muser_screen_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `mpermissions`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tassignmentattempts` ADD CONSTRAINT `tassignmentattempts_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tassignmentattempts` ADD CONSTRAINT `tassignmentattempts_iHeroUserMasterId_fkey` FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tidempotencykeys` ADD CONSTRAINT `tidempotencykeys_createdByUserMasterId_fkey` FOREIGN KEY (`createdByUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingstatushistory` ADD CONSTRAINT `tbookingstatushistory_iBookingTransId_fkey` FOREIGN KEY (`iBookingTransId`) REFERENCES `tbookings`(`iTransId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbookingstatushistory` ADD CONSTRAINT `tbookingstatushistory_changedByUserMasterId_fkey` FOREIGN KEY (`changedByUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdevicetokens` ADD CONSTRAINT `mdevicetokens_iUserMasterId_fkey` FOREIGN KEY (`iUserMasterId`) REFERENCES `musers`(`iMasterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `mcoupons` RENAME INDEX `mCoupons_sCode_key` TO `mcoupons_sCode_key`;

-- RenameIndex
ALTER TABLE `mcouponservicemappings` RENAME INDEX `mCouponServiceMappings_iCouponMasterId_iServiceMasterId_key` TO `mcouponservicemappings_iCouponMasterId_iServiceMasterId_key`;

-- RenameIndex
ALTER TABLE `mcouponservicemappings` RENAME INDEX `mCouponServiceMappings_iServiceMasterId_idx` TO `mcouponservicemappings_iServiceMasterId_idx`;

-- RenameIndex
ALTER TABLE `mcustomerprofiles` RENAME INDEX `mCustomerProfiles_customerCode_key` TO `mcustomerprofiles_customerCode_key`;

-- RenameIndex
ALTER TABLE `mcustomerprofiles` RENAME INDEX `mCustomerProfiles_iUserMasterId_key` TO `mcustomerprofiles_iUserMasterId_key`;

-- RenameIndex
ALTER TABLE `memployeeprofiles` RENAME INDEX `mEmployeeProfiles_employeeCode_key` TO `memployeeprofiles_employeeCode_key`;

-- RenameIndex
ALTER TABLE `memployeeprofiles` RENAME INDEX `mEmployeeProfiles_iUserMasterId_key` TO `memployeeprofiles_iUserMasterId_key`;

-- RenameIndex
ALTER TABLE `mheroprofiles` RENAME INDEX `mHeroProfiles_heroCode_key` TO `mheroprofiles_heroCode_key`;

-- RenameIndex
ALTER TABLE `mheroprofiles` RENAME INDEX `mHeroProfiles_iUserMasterId_key` TO `mheroprofiles_iUserMasterId_key`;

-- RenameIndex
ALTER TABLE `mheroserviceareas` RENAME INDEX `mHeroServiceAreas_iHeroUserMasterId_idx` TO `mheroserviceareas_iHeroUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `mheroservicemappings` RENAME INDEX `mHeroServiceMappings_iHeroUserMasterId_iServiceMasterId_key` TO `mheroservicemappings_iHeroUserMasterId_iServiceMasterId_key`;

-- RenameIndex
ALTER TABLE `mheroservicemappings` RENAME INDEX `mHeroServiceMappings_iServiceMasterId_idx` TO `mheroservicemappings_iServiceMasterId_idx`;

-- RenameIndex
ALTER TABLE `mroles` RENAME INDEX `mRoles_precedence_key` TO `mroles_precedence_key`;

-- RenameIndex
ALTER TABLE `mroles` RENAME INDEX `mRoles_sCode_key` TO `mroles_sCode_key`;

-- RenameIndex
ALTER TABLE `mroles` RENAME INDEX `mRoles_sName_key` TO `mroles_sName_key`;

-- RenameIndex
ALTER TABLE `mservicecategories` RENAME INDEX `mServiceCategories_sCode_key` TO `mservicecategories_sCode_key`;

-- RenameIndex
ALTER TABLE `mservicecategories` RENAME INDEX `mServiceCategories_sName_key` TO `mservicecategories_sName_key`;

-- RenameIndex
ALTER TABLE `mserviceimages` RENAME INDEX `mServiceImages_iServiceMasterId_idx` TO `mserviceimages_iServiceMasterId_idx`;

-- RenameIndex
ALTER TABLE `mservices` RENAME INDEX `mServices_iServiceCategoryMasterId_idx` TO `mservices_iServiceCategoryMasterId_idx`;

-- RenameIndex
ALTER TABLE `mservices` RENAME INDEX `mServices_iServiceTypeMasterId_idx` TO `mservices_iServiceTypeMasterId_idx`;

-- RenameIndex
ALTER TABLE `mservices` RENAME INDEX `mServices_sCode_key` TO `mservices_sCode_key`;

-- RenameIndex
ALTER TABLE `mservices` RENAME INDEX `mServices_sName_key` TO `mservices_sName_key`;

-- RenameIndex
ALTER TABLE `mserviceslots` RENAME INDEX `mServiceSlots_iServiceMasterId_idx` TO `mserviceslots_iServiceMasterId_idx`;

-- RenameIndex
ALTER TABLE `mservicetypes` RENAME INDEX `mServiceTypes_sCode_key` TO `mservicetypes_sCode_key`;

-- RenameIndex
ALTER TABLE `mservicetypes` RENAME INDEX `mServiceTypes_sName_key` TO `mservicetypes_sName_key`;

-- RenameIndex
ALTER TABLE `msubscriptions` RENAME INDEX `mSubscriptions_iCustomerUserMasterId_idx` TO `msubscriptions_iCustomerUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `msubscriptions` RENAME INDEX `mSubscriptions_iSubscriptionTypeMasterId_idx` TO `msubscriptions_iSubscriptionTypeMasterId_idx`;

-- RenameIndex
ALTER TABLE `msubscriptiontypes` RENAME INDEX `mSubscriptionTypes_sCode_key` TO `msubscriptiontypes_sCode_key`;

-- RenameIndex
ALTER TABLE `msubscriptiontypes` RENAME INDEX `mSubscriptionTypes_sName_key` TO `msubscriptiontypes_sName_key`;

-- RenameIndex
ALTER TABLE `museraddresses` RENAME INDEX `mUserAddresses_iUserMasterId_idx` TO `museraddresses_iUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `musers` RENAME INDEX `mUsers_email_key` TO `musers_email_key`;

-- RenameIndex
ALTER TABLE `musers` RENAME INDEX `mUsers_username_key` TO `musers_username_key`;

-- RenameIndex
ALTER TABLE `musertypes` RENAME INDEX `mUserTypes_sCode_key` TO `musertypes_sCode_key`;

-- RenameIndex
ALTER TABLE `musertypes` RENAME INDEX `mUserTypes_sName_key` TO `musertypes_sName_key`;

-- RenameIndex
ALTER TABLE `tbookingassignments` RENAME INDEX `tBookingAssignments_iBookingTransId_idx` TO `tbookingassignments_iBookingTransId_idx`;

-- RenameIndex
ALTER TABLE `tbookingassignments` RENAME INDEX `tBookingAssignments_iHeroUserMasterId_idx` TO `tbookingassignments_iHeroUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookingimages` RENAME INDEX `tBookingImages_iBookingTransId_idx` TO `tbookingimages_iBookingTransId_idx`;

-- RenameIndex
ALTER TABLE `tbookingimages` RENAME INDEX `tBookingImages_uploadedByUserMasterId_idx` TO `tbookingimages_uploadedByUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookingratings` RENAME INDEX `tBookingRatings_iBookingTransId_ratingType_ratedByUserMaster_key` TO `tbookingratings_iBookingTransId_ratingType_ratedByUserMaster_key`;

-- RenameIndex
ALTER TABLE `tbookingratings` RENAME INDEX `tBookingRatings_ratedByUserMasterId_idx` TO `tbookingratings_ratedByUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookingratings` RENAME INDEX `tBookingRatings_ratedToUserMasterId_idx` TO `tbookingratings_ratedToUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_bookingNo_key` TO `tbookings_bookingNo_key`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iAddressMasterId_idx` TO `tbookings_iAddressMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iCouponMasterId_idx` TO `tbookings_iCouponMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iCustomerUserMasterId_idx` TO `tbookings_iCustomerUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iServiceMasterId_idx` TO `tbookings_iServiceMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iSlotMasterId_idx` TO `tbookings_iSlotMasterId_idx`;

-- RenameIndex
ALTER TABLE `tbookings` RENAME INDEX `tBookings_iSubscriptionMasterId_idx` TO `tbookings_iSubscriptionMasterId_idx`;

-- RenameIndex
ALTER TABLE `tpayments` RENAME INDEX `tPayments_iBookingTransId_idx` TO `tpayments_iBookingTransId_idx`;

-- RenameIndex
ALTER TABLE `tpayments` RENAME INDEX `tPayments_paidByUserMasterId_idx` TO `tpayments_paidByUserMasterId_idx`;

-- RenameIndex
ALTER TABLE `tpayments` RENAME INDEX `tPayments_providerPaymentId_idx` TO `tpayments_providerPaymentId_idx`;

-- RenameIndex
ALTER TABLE `tpaymentwebhooks` RENAME INDEX `tPaymentWebhooks_iPaymentTransId_idx` TO `tpaymentwebhooks_iPaymentTransId_idx`;

