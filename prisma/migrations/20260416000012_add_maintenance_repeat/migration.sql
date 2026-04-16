ALTER TABLE "Maintenance" ADD COLUMN "repeatIntervalMonths" INTEGER;
ALTER TABLE "Maintenance" ADD COLUMN "parentId" INTEGER;
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Maintenance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
