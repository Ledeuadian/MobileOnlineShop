-- Create PRODUCT_TYPE table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."PRODUCT_TYPE" (
    "productTypeId" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL,
    "Brand" VARCHAR(255),
    "Variant" VARCHAR(255),
    "Unit" VARCHAR(50) NOT NULL,
    "Quantity" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public."PRODUCT_TYPE" ENABLE ROW LEVEL SECURITY;

-- Create public read policy for PRODUCT_TYPE table
CREATE POLICY "Public can view product types" ON public."PRODUCT_TYPE"
    FOR SELECT USING (true);

-- Create policy for authenticated users to insert product types
CREATE POLICY "Authenticated users can insert product types" ON public."PRODUCT_TYPE"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update product types
CREATE POLICY "Authenticated users can update product types" ON public."PRODUCT_TYPE"
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete product types
CREATE POLICY "Authenticated users can delete product types" ON public."PRODUCT_TYPE"
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_product_type_name" ON public."PRODUCT_TYPE"("Name");
CREATE INDEX IF NOT EXISTS "idx_product_type_brand" ON public."PRODUCT_TYPE"("Brand");
CREATE INDEX IF NOT EXISTS "idx_product_type_unit" ON public."PRODUCT_TYPE"("Unit");

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_type_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_type_updated_at 
    BEFORE UPDATE ON public."PRODUCT_TYPE" 
    FOR EACH ROW EXECUTE FUNCTION update_product_type_updated_at();