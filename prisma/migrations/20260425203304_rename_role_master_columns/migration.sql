-- DropForeignKey
ALTER TABLE `mUsers` DROP FOREIGN KEY `mUsers_roleId_fkey`;

-- DropIndex
DROP INDEX `mRoles_name_key` ON `mRoles`;

-- AlterTable
ALTER TABLE `mRoles`
  CHANGE COLUMN `id` `iMasterId` INTEGER NOT NULL AUTO_INCREMENT,
  CHANGE COLUMN `name` `sName` VARCHAR(191) NOT NULL,
  ADD COLUMN `sCode` VARCHAR(191) NULL AFTER `iMasterId`;

-- Backfill sCode for existing records
UPDATE `mRoles`
SET `sCode` = CONCAT('ROLE_', `iMasterId`)
WHERE `sCode` IS NULL OR `sCode` = '';

-- Enforce mandatory + unique master fields
ALTER TABLE `mRoles`
  MODIFY `sCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `mRoles_sCode_key` ON `mRoles`(`sCode`);
CREATE UNIQUE INDEX `mRoles_sName_key` ON `mRoles`(`sName`);

-- AlterTable
ALTER TABLE `mUsers`
  CHANGE COLUMN `roleId` `iRoleMasterId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `mUsers`
  ADD CONSTRAINT `mUsers_iRoleMasterId_fkey`
  FOREIGN KEY (`iRoleMasterId`) REFERENCES `mRoles`(`iMasterId`)
  ON DELETE SET NULL ON UPDATE CASCADE;