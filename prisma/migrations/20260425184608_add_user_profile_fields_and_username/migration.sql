-- AlterTable
ALTER TABLE `mUsers`
  CHANGE COLUMN `name` `username` VARCHAR(191) NOT NULL,
  ADD COLUMN `firstName` VARCHAR(191) NULL,
  ADD COLUMN `middleName` VARCHAR(191) NULL,
  ADD COLUMN `lastName` VARCHAR(191) NULL,
  ADD COLUMN `address` VARCHAR(191) NULL,
  ADD COLUMN `mobileNo` VARCHAR(191) NULL,
  ADD COLUMN `alternateNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `mUsers_username_key` ON `mUsers`(`username`);