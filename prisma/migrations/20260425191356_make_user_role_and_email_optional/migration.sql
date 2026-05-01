-- DropForeignKey
ALTER TABLE `mUsers` DROP FOREIGN KEY `mUsers_roleId_fkey`;

-- AlterTable
ALTER TABLE `mUsers`
  MODIFY `email` VARCHAR(191) NULL,
  MODIFY `roleId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `mUsers`
  ADD CONSTRAINT `mUsers_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `mRoles`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;