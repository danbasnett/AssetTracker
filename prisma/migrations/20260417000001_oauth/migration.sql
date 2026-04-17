ALTER TABLE "User" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "OAuthProvider" (
  "id"           SERIAL PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "label"        TEXT NOT NULL,
  "clientId"     TEXT NOT NULL,
  "clientSecret" TEXT NOT NULL,
  "enabled"      BOOLEAN NOT NULL DEFAULT true,
  "defaultRole"  "Role" NOT NULL DEFAULT 'VIEW_ONLY',
  "appleTeamId"  TEXT,
  "appleKeyId"   TEXT,
  "applePrivKey" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "OAuthProvider_name_key" ON "OAuthProvider"("name");
