-- AlterTable
ALTER TABLE `user` ADD COLUMN `faceDataFront` LONGTEXT NULL,
    ADD COLUMN `faceDataLeft` LONGTEXT NULL,
    ADD COLUMN `faceDataRight` LONGTEXT NULL,
    ADD COLUMN `faceDataTilt` LONGTEXT NULL,
    ADD COLUMN `faceDescriptorFront` LONGTEXT NULL,
    ADD COLUMN `faceDescriptorLeft` LONGTEXT NULL,
    ADD COLUMN `faceDescriptorRight` LONGTEXT NULL,
    ADD COLUMN `faceDescriptorTilt` LONGTEXT NULL;
