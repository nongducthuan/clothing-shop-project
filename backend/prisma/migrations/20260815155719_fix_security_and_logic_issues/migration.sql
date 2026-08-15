-- AlterTable
ALTER TABLE `orders` ADD COLUMN `delivered_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `otps` ADD COLUMN `failed_attempts` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `sales` MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `vouchers` MODIFY `status` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `otps_email_idx` ON `otps`(`email`);

-- CreateIndex
CREATE INDEX `idx_upi_user_product` ON `user_product_interaction`(`user_id`, `product_id`);
