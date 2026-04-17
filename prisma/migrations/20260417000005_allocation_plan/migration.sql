CREATE TABLE "AllocationPlanItem" (
  "id"           SERIAL PRIMARY KEY,
  "allocationId" INTEGER NOT NULL,
  "description"  TEXT NOT NULL,
  "modelNumber"  TEXT,
  "quantity"     INTEGER NOT NULL DEFAULT 1,
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AllocationPlanItem_allocationId_fkey"
    FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
