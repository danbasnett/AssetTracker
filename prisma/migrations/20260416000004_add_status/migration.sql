CREATE TABLE "Status" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL
);

INSERT INTO "Status" ("name") VALUES
  ('available'),
  ('checked_out'),
  ('repair'),
  ('retired');
