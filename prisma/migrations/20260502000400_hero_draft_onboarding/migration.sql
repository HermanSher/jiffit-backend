ALTER TABLE `theroonboardingapplications`
MODIFY COLUMN `addressLine1` VARCHAR(191) NULL,
MODIFY COLUMN `city` VARCHAR(191) NULL;

INSERT INTO `mpermissions` (`sCode`, `sName`, `description`, `isActive`, `isDeleted`, `createdAt`, `updatedAt`)
VALUES
  ('HERO_VERIFICATION_UPDATE', 'Update Hero Verification', 'Update draft or incomplete hero onboarding applications from dashboard.', true, false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `sName` = VALUES(`sName`),
  `description` = VALUES(`description`),
  `isActive` = true,
  `isDeleted` = false,
  `updatedAt` = CURRENT_TIMESTAMP(3);
