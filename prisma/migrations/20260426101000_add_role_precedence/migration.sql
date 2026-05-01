ALTER TABLE `mRoles`
  ADD COLUMN `precedence` INTEGER NULL;

UPDATE `mRoles`
SET `precedence` = 1
WHERE UPPER(TRIM(`sCode`)) = 'SU';

UPDATE `mRoles` AS role_row
JOIN (
  SELECT
    `iMasterId`,
    ROW_NUMBER() OVER (ORDER BY `iMasterId` ASC) AS `row_no`
  FROM `mRoles`
  WHERE UPPER(TRIM(`sCode`)) <> 'SU'
) AS numbered_roles
  ON numbered_roles.`iMasterId` = role_row.`iMasterId`
SET role_row.`precedence` = numbered_roles.`row_no` + 1;

ALTER TABLE `mRoles`
  MODIFY `precedence` INTEGER NOT NULL;

CREATE UNIQUE INDEX `mRoles_precedence_key` ON `mRoles`(`precedence`);
