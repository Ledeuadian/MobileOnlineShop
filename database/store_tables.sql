-- Create GROCERY_STORE table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.GROCERY_STORE (
    storeId SERIAL PRIMARY KEY,
    storeName VARCHAR(255) NOT NULL,
    storeDescription TEXT,
    store_address TEXT,
    store_phone VARCHAR(50),
    store_email VARCHAR(255),
    store_image_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create ITEMS_IN_STORE table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ITEMS_IN_STORE (
    storeItemId SERIAL PRIMARY KEY,
    storeId INTEGER REFERENCES public.GROCERY_STORE(storeId) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    price NUMERIC(10,2) DEFAULT 0.00,
    availability INTEGER DEFAULT 0,
    item_image_url TEXT,
    item_name VARCHAR(255),
    item_description TEXT,
    item_price DECIMAL(10,2) DEFAULT 0.00,
    item_quantity INTEGER DEFAULT 0,
    item_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE public.GROCERY_STORE ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ITEMS_IN_STORE ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for GROCERY_STORE table
CREATE POLICY "Users can view their own store" ON public.GROCERY_STORE
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own store" ON public.GROCERY_STORE
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store" ON public.GROCERY_STORE
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own store" ON public.GROCERY_STORE
    FOR DELETE USING (auth.uid() = owner_id);

-- Create RLS policies for ITEMS_IN_STORE table
CREATE POLICY "Users can view items from their store" ON public.ITEMS_IN_STORE
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.GROCERY_STORE 
            WHERE GROCERY_STORE.storeId = ITEMS_IN_STORE.storeId 
            AND GROCERY_STORE.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items to their store" ON public.ITEMS_IN_STORE
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.GROCERY_STORE 
            WHERE GROCERY_STORE.storeId = ITEMS_IN_STORE.storeId 
            AND GROCERY_STORE.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their store" ON public.ITEMS_IN_STORE
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.GROCERY_STORE 
            WHERE GROCERY_STORE.storeId = ITEMS_IN_STORE.storeId 
            AND GROCERY_STORE.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their store" ON public.ITEMS_IN_STORE
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.GROCERY_STORE 
            WHERE GROCERY_STORE.storeId = ITEMS_IN_STORE.storeId 
            AND GROCERY_STORE.owner_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grocery_store_owner_id ON public.GROCERY_STORE(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_in_store_store_id ON public.ITEMS_IN_STORE(storeId);
CREATE INDEX IF NOT EXISTS idx_items_in_store_category ON public.ITEMS_IN_STORE(item_category);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_grocery_store_updated_at 
    BEFORE UPDATE ON public.GROCERY_STORE 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_in_store_updated_at 
    BEFORE UPDATE ON public.ITEMS_IN_STORE 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
