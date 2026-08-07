-- One-shot "update the game files on the next start" flag (GH #8/#12/#14).
ALTER TABLE "Server" ADD COLUMN "updateRequested" BOOLEAN NOT NULL DEFAULT false;
