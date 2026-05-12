-- ============================================================
-- STORE_EARNINGS table
-- Tracks per-order earnings for each store after GCash/Maya payment.
-- 5% platform fee is deducted; net amount is what the store earns.
-- Admin marks records as 'disbursed' after paying the store.
-- ============================================================

CREATE TABLE IF NOT EXISTS "STORE_EARNINGS" (
  "earningId"     SERIAL PRIMARY KEY,
  "storeId"       INTEGER       NOT NULL REFERENCES "GROCERY_STORE"("storeId"),
  "orderId"       INTEGER       NOT NULL REFERENCES "ORDERS"("orderId"),
  "grossAmount"   NUMERIC(10,2) NOT NULL,   -- order total paid by shopper
  "platformFee"   NUMERIC(10,2) NOT NULL,   -- 5% of grossAmount
  "netAmount"     NUMERIC(10,2) NOT NULL,   -- grossAmount - platformFee (store receives this)
  "paymentMethod" TEXT          NOT NULL,   -- 'GCash' | 'Maya'
  "paymentId"     TEXT          NOT NULL,   -- PayMongo payment ID for reference
  "status"        TEXT          NOT NULL DEFAULT 'pending',  -- 'pending' | 'disbursed'
  "disbursementRef" TEXT,        -- Xendit disbursement ID after payout
  "disbursedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for quick store lookups
CREATE INDEX IF NOT EXISTS idx_store_earnings_store ON "STORE_EARNINGS"("storeId");
CREATE INDEX IF NOT EXISTS idx_store_earnings_order ON "STORE_EARNINGS"("orderId");
CREATE INDEX IF NOT EXISTS idx_store_earnings_status ON "STORE_EARNINGS"("status");

-- Row Level Security
ALTER TABLE "STORE_EARNINGS" ENABLE ROW LEVEL SECURITY;

-- Store owners can only read their own earnings
CREATE POLICY "store_owner_read_own_earnings" ON "STORE_EARNINGS"
  FOR SELECT
  USING (
    "storeId" IN (
      SELECT "storeId" FROM "GROCERY_STORE"
      WHERE owner_id = auth.uid()
    )
  );

-- Admins can read all earnings
CREATE POLICY "admin_read_all_earnings" ON "STORE_EARNINGS"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "USER"
      WHERE auth_user_id = auth.uid()
      AND "userTypeCode" = 1
    )
  );

-- Only service role (edge functions) can insert/update earnings
-- (No INSERT/UPDATE policies needed — edge function uses service role key)
