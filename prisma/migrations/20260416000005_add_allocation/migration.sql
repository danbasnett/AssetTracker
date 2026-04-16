CREATE TABLE "Allocation" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "indefinite" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "_AllocationAssets" (
  "A" INTEGER NOT NULL,
  "B" INTEGER NOT NULL,
  CONSTRAINT "_AllocationAssets_AB_unique" UNIQUE ("A", "B"),
  CONSTRAINT "_AllocationAssets_A_fkey" FOREIGN KEY ("A") REFERENCES "Allocation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_AllocationAssets_B_fkey" FOREIGN KEY ("B") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "_AllocationAssets_B_index" ON "_AllocationAssets"("B");
