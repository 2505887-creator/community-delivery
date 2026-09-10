-- Phase 4: payment records and real inventory quantities.
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded');

ALTER TABLE "StoreItem" ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0;
UPDATE "StoreItem" SET "stockQuantity" = CASE WHEN "inStock" THEN 1 ELSE 0 END WHERE "stockQuantity" = 0;

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "method" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "provider" TEXT,
  "providerReference" TEXT,
  "checkoutRequestId" TEXT,
  "merchantRequestId" TEXT,
  "phone" TEXT,
  "rawResponse" JSONB,
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
