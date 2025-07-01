/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `unitgroups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `units` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `schools_name_key` ON `schools`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `unitgroups_name_key` ON `unitgroups`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `units_name_key` ON `units`(`name`);
