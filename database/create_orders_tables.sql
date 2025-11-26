-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public."ORDER_ITEMS" CASCADE;
DROP TABLE IF EXISTS public."NOTIFICATIONS" CASCADE;
DROP TABLE IF EXISTS public."ORDERS" CASCADE;

-- Create ORDERS table to track customer orders
CREATE TABLE IF NOT EXISTS public."ORDERS" (
    "orderId" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES public."USER"("userId") ON DELETE CASCADE,
    "storeId" INTEGER NOT NULL REFERENCES public."GROCERY_STORE"("storeId") ON DELETE CASCADE,
    "orderNumber" TEXT UNIQUE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, preparing, ready, picked_up, cancelled
    "paymentMethod" TEXT NOT NULL, -- cash, gcash, paymaya
    "total" NUMERIC(10, 2) NOT NULL,
    "savings" NUMERIC(10, 2) DEFAULT 0,
    "itemsCount" INTEGER NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ORDER_ITEMS table to track individual items in each order
CREATE TABLE IF NOT EXISTS public."ORDER_ITEMS" (
    "orderItemId" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL REFERENCES public."ORDERS"("orderId") ON DELETE CASCADE,
    "storeItemId" INTEGER NOT NULL REFERENCES public."ITEMS_IN_STORE"("storeItemId") ON DELETE CASCADE,
    "quantity" INTEGER NOT NULL,
    "price" NUMERIC(10, 2) NOT NULL,
    "subTotal" NUMERIC(10, 2) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NOTIFICATIONS table for store owners
CREATE TABLE IF NOT EXISTS public."NOTIFICATIONS" (
    "notificationId" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES public."USER"("userId") ON DELETE CASCADE, -- Store owner's userId
    "orderId" INTEGER REFERENCES public."ORDERS"("orderId") ON DELETE CASCADE,
    "customerName" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, ready, picked_up
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user ON public."ORDERS"("userId");
CREATE INDEX IF NOT EXISTS idx_orders_store ON public."ORDERS"("storeId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON public."ORDERS"("status");
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public."ORDER_ITEMS"("orderId");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public."NOTIFICATIONS"("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public."NOTIFICATIONS"("status");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public."NOTIFICATIONS"("isRead");

-- Enable Row Level Security
ALTER TABLE public."ORDERS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ORDER_ITEMS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NOTIFICATIONS" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ORDERS
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public."ORDERS"
    FOR SELECT USING (
        "userId" = (
            SELECT "userId" FROM public."USER" 
            WHERE "email" = auth.email()
        )
    );

-- Store owners can view orders for their stores
CREATE POLICY "Store owners can view store orders" ON public."ORDERS"
    FOR SELECT USING (
        "storeId" IN (
            SELECT "storeId" FROM public."GROCERY_STORE"
            WHERE "owner_id" = auth.uid()
        )
    );

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON public."ORDERS"
    FOR INSERT WITH CHECK (
        "userId" = (
            SELECT "userId" FROM public."USER" 
            WHERE "email" = auth.email()
        )
    );

-- Store owners can update orders for their stores
CREATE POLICY "Store owners can update store orders" ON public."ORDERS"
    FOR UPDATE USING (
        "storeId" IN (
            SELECT "storeId" FROM public."GROCERY_STORE"
            WHERE "owner_id" = auth.uid()
        )
    );

-- RLS Policies for ORDER_ITEMS
-- Users can view items in their orders
CREATE POLICY "Users can view own order items" ON public."ORDER_ITEMS"
    FOR SELECT USING (
        "orderId" IN (
            SELECT "orderId" FROM public."ORDERS"
            WHERE "userId" = (
                SELECT "userId" FROM public."USER" 
                WHERE "email" = auth.email()
            )
        )
    );

-- Store owners can view items in their store orders
CREATE POLICY "Store owners can view store order items" ON public."ORDER_ITEMS"
    FOR SELECT USING (
        "orderId" IN (
            SELECT o."orderId" FROM public."ORDERS" o
            INNER JOIN public."GROCERY_STORE" gs ON o."storeId" = gs."storeId"
            WHERE gs."owner_id" = auth.uid()
        )
    );

-- Users can insert items in their own orders
CREATE POLICY "Users can insert own order items" ON public."ORDER_ITEMS"
    FOR INSERT WITH CHECK (
        "orderId" IN (
            SELECT "orderId" FROM public."ORDERS"
            WHERE "userId" = (
                SELECT "userId" FROM public."USER" 
                WHERE "email" = auth.email()
            )
        )
    );

-- RLS Policies for NOTIFICATIONS
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public."NOTIFICATIONS"
    FOR SELECT USING (
        "userId" = (
            SELECT "userId" FROM public."USER" 
            WHERE "email" = auth.email()
        )
    );

-- System can insert notifications (service role)
CREATE POLICY "Allow insert notifications" ON public."NOTIFICATIONS"
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public."NOTIFICATIONS"
    FOR UPDATE USING (
        "userId" = (
            SELECT "userId" FROM public."USER" 
            WHERE "email" = auth.email()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public."ORDERS" TO authenticated;
GRANT ALL ON public."ORDER_ITEMS" TO authenticated;
GRANT ALL ON public."NOTIFICATIONS" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "ORDERS_orderId_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "ORDER_ITEMS_orderItemId_seq" TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE "NOTIFICATIONS_notificationId_seq" TO authenticated;
