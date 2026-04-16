-- AlterTable
ALTER TABLE "Consumable" ADD COLUMN "locationId" INTEGER;

-- AddForeignKey
ALTER TABLE "Consumable" ADD CONSTRAINT "Consumable_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
