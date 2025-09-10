-- Create GROCERY_LIST table for shopping cart functionality
-- This table stores items that users add to their cart

CREATE TABLE IF NOT EXISTS public.GROCERY_LIST (
    grocery_list_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    storeItemId INTEGER REFERENCES public.ITEMS_IN_STORE(storeItemId) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add unique constraint to prevent duplicate items in cart for same user
ALTER TABLE public.GROCERY_LIST 
ADD CONSTRAINT unique_user_item 
UNIQUE (user_id, storeItemId);

-- Enable Row Level Security (RLS)
ALTER TABLE public.GROCERY_LIST ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for GROCERY_LIST table
CREATE POLICY "Users can view their own grocery list" ON public.GROCERY_LIST
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own grocery list" ON public.GROCERY_LIST
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery list" ON public.GROCERY_LIST
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own grocery list" ON public.GROCERY_LIST
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grocery_list_user_id ON public.GROCERY_LIST(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_list_store_item ON public.GROCERY_LIST(storeItemId);
