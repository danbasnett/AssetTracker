CREATE TABLE "AuditLog" (
  "id"         SERIAL PRIMARY KEY,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"     INTEGER NOT NULL,
  "username"   TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entityId"   INTEGER,
  "entityName" TEXT,
  "detail"     TEXT
);
