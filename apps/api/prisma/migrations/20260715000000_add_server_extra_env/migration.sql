-- User-defined extra environment variables for a server, stored ENCRYPTED
-- (AES-256-GCM via SECRETS_KEY) because they routinely carry credentials —
-- pinning a Palworld build needs STEAM_USERNAME/STEAM_PASSWORD next to
-- TARGET_MANIFEST_ID. Null = none set. Decrypts to Array<{key, value}>.
ALTER TABLE "Server" ADD COLUMN "extraEnvEnc" TEXT;
