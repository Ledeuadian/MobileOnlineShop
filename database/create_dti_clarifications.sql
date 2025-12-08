-- Create DTI_CLARIFICATIONS table for Notice of Clarification
DROP TABLE IF EXISTS public."DTI_CLARIFICATIONS" CASCADE;

CREATE TABLE IF NOT EXISTS public."DTI_CLARIFICATIONS" (
    "clarificationId" SERIAL PRIMARY KEY,
    "storeId" INTEGER NOT NULL REFERENCES public."GROCERY_STORE"("storeId") ON DELETE CASCADE,
    "itemId" INTEGER REFERENCES public."ITEMS_IN_STORE"("storeItemId") ON DELETE SET NULL,
    "dtiUserId" INTEGER NOT NULL REFERENCES public."USER"("userId") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, responded, resolved
    "storeResponse" TEXT,
    "supplierInvoiceUrl" TEXT,
    "deliveryReceiptUrl" TEXT,
    "proofOfCostUrl" TEXT,
    "freightJustificationUrl" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clarifications_store ON public."DTI_CLARIFICATIONS"("storeId");
CREATE INDEX IF NOT EXISTS idx_clarifications_dti ON public."DTI_CLARIFICATIONS"("dtiUserId");
CREATE INDEX IF NOT EXISTS idx_clarifications_status ON public."DTI_CLARIFICATIONS"("status");
CREATE INDEX IF NOT EXISTS idx_clarifications_read ON public."DTI_CLARIFICATIONS"("isRead");

-- Enable Row Level Security
ALTER TABLE public."DTI_CLARIFICATIONS" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for DTI_CLARIFICATIONS

-- DTI users can view all clarifications
CREATE POLICY "DTI can view all clarifications" ON public."DTI_CLARIFICATIONS"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."USER"
            WHERE "USER"."email" = auth.email()
            AND "USER"."userTypeCode" = 3
        )
    );

-- Store owners can view clarifications sent to their store
CREATE POLICY "Stores can view own clarifications" ON public."DTI_CLARIFICATIONS"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."GROCERY_STORE"
            WHERE "GROCERY_STORE"."storeId" = "DTI_CLARIFICATIONS"."storeId"
            AND "GROCERY_STORE"."owner_id" = auth.uid()
        )
    );

-- DTI users can insert clarifications
CREATE POLICY "DTI can insert clarifications" ON public."DTI_CLARIFICATIONS"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."USER"
            WHERE "USER"."email" = auth.email()
            AND "USER"."userTypeCode" = 3
        )
    );

-- Store owners can update their clarifications (add response)
CREATE POLICY "Stores can update own clarifications" ON public."DTI_CLARIFICATIONS"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public."GROCERY_STORE"
            WHERE "GROCERY_STORE"."storeId" = "DTI_CLARIFICATIONS"."storeId"
            AND "GROCERY_STORE"."owner_id" = auth.uid()
        )
    );

-- DTI users can update clarifications
CREATE POLICY "DTI can update clarifications" ON public."DTI_CLARIFICATIONS"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public."USER"
            WHERE "USER"."email" = auth.email()
            AND "USER"."userTypeCode" = 3
        )
    );

-- Grant permissions
GRANT ALL ON public."DTI_CLARIFICATIONS" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public."DTI_CLARIFICATIONS_clarificationId_seq" TO authenticated;
