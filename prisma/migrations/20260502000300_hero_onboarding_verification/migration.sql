ALTER TABLE `mheroprofiles`
ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `verificationStatus` ENUM('DRAFT', 'SUBMITTED', 'PENDING_HUB_VERIFICATION', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'DRAFT';

CREATE TABLE `mhubs` (
  `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
  `sName` VARCHAR(191) NOT NULL,
  `addressLine1` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `contactNumber` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `mhubs_city_idx`(`city`),
  INDEX `mhubs_isActive_idx`(`isActive`),
  INDEX `mhubs_latitude_longitude_idx`(`latitude`, `longitude`),
  PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `theroonboardingapplications` (
  `iTransId` INTEGER NOT NULL AUTO_INCREMENT,
  `iHeroUserMasterId` INTEGER NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `mobileNumber` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `dateOfBirth` DATETIME(3) NULL,
  `gender` VARCHAR(191) NULL,
  `fatherName` VARCHAR(191) NULL,
  `alternateMobileNumber` VARCHAR(191) NULL,
  `addressLine1` VARCHAR(191) NOT NULL,
  `addressLine2` VARCHAR(191) NULL,
  `city` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NULL,
  `pincode` VARCHAR(191) NULL,
  `latitude` DECIMAL(10, 7) NULL,
  `longitude` DECIMAL(10, 7) NULL,
  `selectedJobRole` VARCHAR(191) NULL,
  `selectedCity` VARCHAR(191) NULL,
  `workType` VARCHAR(191) NULL,
  `vehicleType` VARCHAR(191) NULL,
  `earningsType` VARCHAR(191) NULL,
  `onboardingSource` VARCHAR(191) NULL,
  `referralCode` VARCHAR(191) NULL,
  `verificationStatus` ENUM('DRAFT', 'SUBMITTED', 'PENDING_HUB_VERIFICATION', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED') NOT NULL DEFAULT 'DRAFT',
  `nearestHubId` INTEGER NULL,
  `submittedAt` DATETIME(3) NULL,
  `verifiedAt` DATETIME(3) NULL,
  `verifiedByUserMasterId` INTEGER NULL,
  `rejectionReason` TEXT NULL,
  `adminRemarks` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `theroonboardingapplications_iHeroUserMasterId_key`(`iHeroUserMasterId`),
  INDEX `theroonboardingapplications_verificationStatus_idx`(`verificationStatus`),
  INDEX `theroonboardingapplications_nearestHubId_idx`(`nearestHubId`),
  INDEX `theroonboardingapplications_verifiedByUserMasterId_idx`(`verifiedByUserMasterId`),
  INDEX `theroonboardingapplications_city_idx`(`city`),
  INDEX `theroonboardingapplications_submittedAt_idx`(`submittedAt`),
  PRIMARY KEY (`iTransId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `theroonboardingapplications`
ADD CONSTRAINT `theroonboardingapplications_iHeroUserMasterId_fkey`
FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `theroonboardingapplications`
ADD CONSTRAINT `theroonboardingapplications_nearestHubId_fkey`
FOREIGN KEY (`nearestHubId`) REFERENCES `mhubs`(`iMasterId`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `theroonboardingapplications`
ADD CONSTRAINT `theroonboardingapplications_verifiedByUserMasterId_fkey`
FOREIGN KEY (`verifiedByUserMasterId`) REFERENCES `musers`(`iMasterId`)
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `mscreens` (`sCode`, `sName`, `description`, `routePath`, `displayOrder`, `isActive`, `isDeleted`, `createdAt`, `updatedAt`)
VALUES ('HERO_VERIFICATIONS', 'Hero Verifications', 'Hub verification queue for hero onboarding applications.', '/hero-verifications', 45, true, false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `sName` = VALUES(`sName`),
  `description` = VALUES(`description`),
  `routePath` = VALUES(`routePath`),
  `isActive` = true,
  `isDeleted` = false,
  `updatedAt` = CURRENT_TIMESTAMP(3);

INSERT INTO `mpermissions` (`sCode`, `sName`, `description`, `isActive`, `isDeleted`, `createdAt`, `updatedAt`)
VALUES
  ('HERO_VERIFICATION_VIEW', 'View Hero Verifications', 'View hero onboarding verification applications.', true, false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('HERO_VERIFICATION_VERIFY', 'Verify Heroes', 'Approve physically verified heroes from dashboard.', true, false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('HERO_VERIFICATION_REJECT', 'Reject Hero Verifications', 'Reject or request resubmission for hero verification applications.', true, false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `sName` = VALUES(`sName`),
  `description` = VALUES(`description`),
  `isActive` = true,
  `isDeleted` = false,
  `updatedAt` = CURRENT_TIMESTAMP(3);
