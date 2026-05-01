-- AlterTable
ALTER TABLE `mcoupons` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mcouponservicemappings` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mcustomerprofiles` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `memployeeprofiles` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mheroprofiles` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mheroserviceareas` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mheroservicemappings` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mroles` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mservicecategories` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mserviceimages` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mservices` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mserviceslots` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `mservicetypes` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `msubscriptions` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `msubscriptiontypes` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `museraddresses` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `musers` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `musertypes` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbookingassignments` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbookingimages` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbookingratings` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tbookings` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tpayments` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tpaymentwebhooks` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedByUserMasterId` INTEGER NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

