-- Create CARTS table
CREATE TABLE IF NOT EXISTS public.CARTS (
    cartId SERIAL PRIMARY KEY,
    userId INTEGER REFERENCES public.USER(userId) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create CART_ITEMS table
CREATE TABLE IF NOT EXISTS public.CART_ITEMS (
    cartItemId SERIAL PRIMARY KEY,
    cartId INTEGER REFERENCES public.CARTS(cartId) ON DELETE CASCADE,
    storeItemId INTEGER REFERENCES public.ITEMS_IN_STORE(storeItemId) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    subTotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE public.CARTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.CART_ITEMS ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for CARTS table
CREATE POLICY "Users can view their own cart" ON public.CARTS
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.USER 
            WHERE USER.userId = CARTS.userId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cart" ON public.CARTS
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.USER 
            WHERE USER.userId = CARTS.userId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cart" ON public.CARTS
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.USER 
            WHERE USER.userId = CARTS.userId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cart" ON public.CARTS
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.USER 
            WHERE USER.userId = CARTS.userId 
            AND USER.authUserId = auth.uid()
        )
    );

-- Create RLS policies for CART_ITEMS table
CREATE POLICY "Users can view their cart items" ON public.CART_ITEMS
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.CARTS 
            JOIN public.USER ON USER.userId = CARTS.userId
            WHERE CARTS.cartId = CART_ITEMS.cartId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can insert their cart items" ON public.CART_ITEMS
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.CARTS 
            JOIN public.USER ON USER.userId = CARTS.userId
            WHERE CARTS.cartId = CART_ITEMS.cartId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can update their cart items" ON public.CART_ITEMS
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.CARTS 
            JOIN public.USER ON USER.userId = CARTS.userId
            WHERE CARTS.cartId = CART_ITEMS.cartId 
            AND USER.authUserId = auth.uid()
        )
    );

CREATE POLICY "Users can delete their cart items" ON public.CART_ITEMS
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.CARTS 
            JOIN public.USER ON USER.userId = CARTS.userId
            WHERE CARTS.cartId = CART_ITEMS.cartId 
            AND USER.authUserId = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.CARTS(userId);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.CART_ITEMS(cartId);
CREATE INDEX IF NOT EXISTS idx_cart_items_store_item_id ON public.CART_ITEMS(storeItemId);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_carts_updated_at 
    BEFORE UPDATE ON public.CARTS 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON public.CART_ITEMS 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
