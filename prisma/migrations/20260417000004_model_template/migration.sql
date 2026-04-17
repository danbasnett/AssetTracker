CREATE TABLE "ModelTemplate" (
  "id"          SERIAL PRIMARY KEY,
  "name"        TEXT NOT NULL UNIQUE,
  "modelNumber" TEXT,
  "supplier"    TEXT,
  "value"       DOUBLE PRECISION,
  "locationId"  INTEGER,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModelTemplate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
