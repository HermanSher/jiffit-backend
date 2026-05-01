-- CreateTable
CREATE TABLE `mUserTypes` (
  `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
  `sCode` VARCHAR(191) NOT NULL,
  `sName` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `mUserTypes_sCode_key`(`sCode`),
  UNIQUE INDEX `mUserTypes_sName_key`(`sName`),
  PRIMARY KEY (`iMasterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `mUsers`
  ADD COLUMN `iUserTypeMasterId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `mUsers`
  ADD CONSTRAINT `mUsers_iUserTypeMasterId_fkey`
  FOREIGN KEY (`iUserTypeMasterId`) REFERENCES `mUserTypes`(`iMasterId`)
  ON DELETE SET NULL ON UPDATE CASCADE;
