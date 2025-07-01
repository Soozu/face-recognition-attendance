/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_userId_fkey`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `leavetypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `maxDaysAllotted` INTEGER NULL,
    `isDeductible` BOOLEAN NOT NULL,

    UNIQUE INDEX `leavetypes_id_key`(`id`),
    UNIQUE INDEX `leavetypes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaverequests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestorId` INTEGER NOT NULL,
    `approvingStage` VARCHAR(191) NOT NULL,
    `approvers` JSON NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `duration` DOUBLE NOT NULL,
    `specificLeaveDates` JSON NULL,
    `officeType` ENUM('SDO', 'School') NOT NULL,
    `leaveTypeId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `dateRequested` DATETIME(3) NOT NULL,
    `dateUpdated` DATETIME(3) NULL,
    `contactInfo` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `rejectionReason` TEXT NULL,
    `remarks` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leavedates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveRequestId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `leaveCoverage` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leavebalances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empId` INTEGER NOT NULL,
    `leaveTypeId` INTEGER NOT NULL,
    `balance` DOUBLE NOT NULL,
    `remaining` DOUBLE NOT NULL,
    `year` VARCHAR(191) NOT NULL,
    `dateUpdated` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unitgroups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `head` BOOLEAN NOT NULL DEFAULT false,
    `unitGroupId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userroles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,

    UNIQUE INDEX `userroles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userpositions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `position` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `userpositions_userId_position_key`(`userId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `uid` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `middleIntl` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `salary` DOUBLE NULL,
    `officeType` ENUM('SDO', 'School') NOT NULL,
    `unitId` INTEGER NULL,
    `schoolId` INTEGER NULL,
    `changePass` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateHired` DATETIME(3) NULL,
    `dateUpdated` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `faceData` LONGTEXT NULL,
    `faceDescriptor` LONGTEXT NULL,
    `faceDataFront` LONGTEXT NULL,
    `faceDataLeft` LONGTEXT NULL,
    `faceDataRight` LONGTEXT NULL,
    `faceDataTilt` LONGTEXT NULL,
    `faceDescriptorFront` LONGTEXT NULL,
    `faceDescriptorLeft` LONGTEXT NULL,
    `faceDescriptorRight` LONGTEXT NULL,
    `faceDescriptorTilt` LONGTEXT NULL,
    `supervisorId` INTEGER NULL,
    `approvingAuthorityId` INTEGER NULL,
    `signaturePath` VARCHAR(191) NULL,
    `initialsPath` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaverequestlogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveRequestId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leaverequestlogs_leaveRequestId_idx`(`leaveRequestId`),
    INDEX `leaverequestlogs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `Attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaverequests` ADD CONSTRAINT `leaverequests_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaverequests` ADD CONSTRAINT `leaverequests_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leavetypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leavebalances` ADD CONSTRAINT `leavebalances_empId_fkey` FOREIGN KEY (`empId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leavebalances` ADD CONSTRAINT `leavebalances_leaveTypeId_fkey` FOREIGN KEY (`leaveTypeId`) REFERENCES `leavetypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_unitGroupId_fkey` FOREIGN KEY (`unitGroupId`) REFERENCES `unitgroups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userroles` ADD CONSTRAINT `userroles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userpositions` ADD CONSTRAINT `userpositions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_approvingAuthorityId_fkey` FOREIGN KEY (`approvingAuthorityId`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaverequestlogs` ADD CONSTRAINT `leaverequestlogs_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `leaverequests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaverequestlogs` ADD CONSTRAINT `leaverequestlogs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
