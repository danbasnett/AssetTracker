CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Maintenance" (
  "id" SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledDate" TIMESTAMP(3),
  "completedDate" TIMESTAMP(3),
  "cost" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Maintenance_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
