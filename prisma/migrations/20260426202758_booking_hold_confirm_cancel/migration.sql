-- DropForeignKey
ALTER TABLE `tbookings` DROP FOREIGN KEY `tBookings_iServiceMasterId_fkey`;

-- AddForeignKey
ALTER TABLE `tBookings` ADD CONSTRAINT `tBookings_iServiceMasterId_fkey` FOREIGN KEY (`iServiceMasterId`) REFERENCES `mServices`(`iMasterId`) ON DELETE SET NULL ON UPDATE CASCADE;
