-- Provider/backend foundation for the existing camel-case Prisma tables.
-- This migration is intentionally additive: it preserves existing rows.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'admin';

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'tenant',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "VerifiedPro" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "VerifiedPro" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "LocalStore" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tenantUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedPro_userId_key" ON "VerifiedPro"("userId") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Driver_userId_key" ON "Driver"("userId") WHERE "userId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "OrderAssignment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "proId" TEXT NOT NULL,
  "driverId" TEXT,
  "assignedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderMessage" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
