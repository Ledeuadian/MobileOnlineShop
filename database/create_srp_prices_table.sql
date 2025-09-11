-- Create SRP_PRICES table for storing Suggested Retail Prices
-- This table will be used by the DTI Dashboard for price monitoring

CREATE TABLE IF NOT EXISTS public."SRP_PRICES" (
    "srpId" SERIAL PRIMARY KEY,
    "productTypeId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "effectiveDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdBy" TEXT DEFAULT 'DTI_SYSTEM',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to PRODUCT_TYPE table
    CONSTRAINT "fk_srp_product_type" 
        FOREIGN KEY ("productTypeId") 
        REFERENCES public."PRODUCT_TYPE"("productTypeId") 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate active prices for same product
    CONSTRAINT "unique_active_srp_per_product" 
        UNIQUE ("productTypeId", "isActive") 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "idx_srp_prices_product_type" 
    ON public."SRP_PRICES"("productTypeId");

CREATE INDEX IF NOT EXISTS "idx_srp_prices_active" 
    ON public."SRP_PRICES"("isActive") 
    WHERE "isActive" = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_srp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS "trigger_update_srp_updated_at" ON public."SRP_PRICES";
CREATE TRIGGER "trigger_update_srp_updated_at"
    BEFORE UPDATE ON public."SRP_PRICES"
    FOR EACH ROW
    EXECUTE FUNCTION update_srp_updated_at();

-- Insert sample SRP data for some products (optional)
-- This will set initial SRP prices for the first 10 products
INSERT INTO public."SRP_PRICES" ("productTypeId", "price", "effectiveDate", "isActive", "createdBy")
SELECT 
    "productTypeId",
    CASE 
        WHEN "Unit" = 'kg' THEN "Quantity" * 50.00  -- ₱50 per kg
        WHEN "Unit" = 'L' THEN "Quantity" * 75.00   -- ₱75 per liter
        WHEN "Unit" = 'ml' THEN "Quantity" * 0.15   -- ₱0.15 per ml
        WHEN "Unit" = 'g' THEN "Quantity" * 0.50    -- ₱0.50 per gram
        ELSE 25.00  -- Default ₱25 per piece
    END as calculated_price,
    CURRENT_TIMESTAMP,
    true,
    'INITIAL_SETUP'
FROM public."PRODUCT_TYPE"
WHERE "productTypeId" <= 20  -- Only first 20 products
ON CONFLICT ("productTypeId", "isActive") DO NOTHING;

-- Display created table info
SELECT 'SRP_PRICES table created successfully' as status;
SELECT COUNT(*) as sample_records_inserted FROM public."SRP_PRICES";

-- Show sample data
SELECT 
    s."srpId",
    s."productTypeId", 
    p."Name" as product_name,
    s."price",
    s."effectiveDate",
    s."isActive"
FROM public."SRP_PRICES" s
JOIN public."PRODUCT_TYPE" p ON s."productTypeId" = p."productTypeId"
ORDER BY s."srpId"
LIMIT 10;
