-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "serialNumber" TEXT;
ALTER TABLE "Asset" ADD COLUMN "modelNumber" TEXT;

-- AlterTable
ALTER TABLE "Consumable" ADD COLUMN "modelNumber" TEXT;
