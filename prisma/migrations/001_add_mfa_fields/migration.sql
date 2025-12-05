-- Adds MFA-related columns to the "User" table for hardened authentication.
ALTER TABLE "User"
  ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfaSecret" TEXT,
  ADD COLUMN "mfaBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
