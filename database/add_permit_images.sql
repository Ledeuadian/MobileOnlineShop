-- Add permit image columns to GROCERY_STORE table
-- These columns will store the image URLs for BIR and DTI permit documents

-- Add BIR permit image URL column
ALTER TABLE "GROCERY_STORE" 
ADD COLUMN IF NOT EXISTS bir_permit_image TEXT;

-- Add DTI permit image URL column
ALTER TABLE "GROCERY_STORE" 
ADD COLUMN IF NOT EXISTS dti_permit_image TEXT;

-- Add comments to explain the column purpose
COMMENT ON COLUMN "GROCERY_STORE".bir_permit_image IS 
'URL of the uploaded BIR permit document image';

COMMENT ON COLUMN "GROCERY_STORE".dti_permit_image IS 
'URL of the uploaded DTI permit document image';
