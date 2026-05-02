CREATE TABLE `mherolivelocations` (
  `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
  `iHeroUserMasterId` INTEGER NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `accuracy` FLOAT NULL,
  `heading` FLOAT NULL,
  `speed` FLOAT NULL,
  `batteryLevel` FLOAT NULL,
  `lastUpdatedAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `mherolivelocations_iHeroUserMasterId_key`(`iHeroUserMasterId`),
  INDEX `mherolivelocations_latitude_longitude_idx`(`latitude`, `longitude`),
  INDEX `mherolivelocations_lastUpdatedAt_idx`(`lastUpdatedAt`),
  PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `mherolivelocations`
ADD CONSTRAINT `mherolivelocations_iHeroUserMasterId_fkey`
FOREIGN KEY (`iHeroUserMasterId`) REFERENCES `musers`(`iMasterId`)
ON DELETE CASCADE ON UPDATE CASCADE;
