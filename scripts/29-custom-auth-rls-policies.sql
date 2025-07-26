-- Custom authentication RLS policies
-- This creates secure policies that work with our custom auth system

-- First, disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE website_login_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for anon users" ON users;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON orders;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON order_items;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON cart_items;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON addresses;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON product_reviews;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON wishlist;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON notifications;
DROP POLICY IF EXISTS "Allow all operations for anon users" ON website_login_sessions;

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlist TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_login_sessions TO anon;

-- Public tables (everyone can read)
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON company TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create helper function to get current user ID from request headers
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_header TEXT;
    user_id UUID;
BEGIN
    -- Get user ID from custom header (set by your app)
    user_id_header := current_setting('request.headers', true)::json->>'x-user-id';
    
    IF user_id_header IS NULL OR user_id_header = '' THEN
        RETURN NULL;
    END IF;
    
    -- Convert to UUID
    BEGIN
        user_id := user_id_header::UUID;
        RETURN user_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$;

-- Alternative function using JWT token
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    user_id UUID;
BEGIN
    -- Get JWT token from Authorization header
    token := current_setting('request.headers', true)::json->>'authorization';
    
    IF token IS NULL OR token = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove 'Bearer ' prefix if present
    IF token LIKE 'Bearer %' THEN
        token := substring(token from 8);
    END IF;
    
    -- Here you would decode JWT and extract user_id
    -- For now, we'll use a simple approach with session lookup
    SELECT u.id INTO user_id
    FROM website_login_sessions wls
    JOIN users u ON u.id = wls.user_id
    WHERE wls.temp_token = token 
      AND wls.status = 'approved'
      AND wls.expires_at > NOW();
    
    RETURN user_id;
END;
$$;

-- Function to check if user owns resource
CREATE OR REPLACE FUNCTION user_owns_resource(resource_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Try to get user ID from custom header first
    current_user_id := get_current_user_id();
    
    -- If not found, try JWT approach
    IF current_user_id IS NULL THEN
        current_user_id := get_user_id_from_jwt();
    END IF;
    
    -- If still no user ID, deny access
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if current user owns the resource
    RETURN current_user_id = resource_user_id;
END;
$$;

-- Enable RLS and create secure policies

-- Users table - users can only access their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (user_owns_resource(id));

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (user_owns_resource(id));

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (user_owns_resource(id)) WITH CHECK (user_owns_resource(id));

CREATE POLICY "users_delete_own" ON users
    FOR DELETE USING (user_owns_resource(id));

-- Orders table - users can only access their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON orders
    FOR SELECT USING (user_owns_resource(customer_id));

CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT WITH CHECK (user_owns_resource(customer_id));

CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE USING (user_owns_resource(customer_id)) WITH CHECK (user_owns_resource(customer_id));

-- Order items table - users can only access items from their orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND user_owns_resource(o.customer_id)
        )
    );

CREATE POLICY "order_items_insert_own" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o 
            WHERE o.id = order_items.order_id 
            AND user_owns_resource(o.customer_id)
        )
    );

-- Cart items table - users can only access their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_items_select_own" ON cart_items
    FOR SELECT USING (user_owns_resource(customer_id));

CREATE POLICY "cart_items_insert_own" ON cart_items
    FOR INSERT WITH CHECK (user_owns_resource(customer_id));

CREATE POLICY "cart_items_update_own" ON cart_items
    FOR UPDATE USING (user_owns_resource(customer_id)) WITH CHECK (user_owns_resource(customer_id));

CREATE POLICY "cart_items_delete_own" ON cart_items
    FOR DELETE USING (user_owns_resource(customer_id));

-- Addresses table - users can only access their own addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_select_own" ON addresses
    FOR SELECT USING (user_owns_resource(user_id));

CREATE POLICY "addresses_insert_own" ON addresses
    FOR INSERT WITH CHECK (user_owns_resource(user_id));

CREATE POLICY "addresses_update_own" ON addresses
    FOR UPDATE USING (user_owns_resource(user_id)) WITH CHECK (user_owns_resource(user_id));

CREATE POLICY "addresses_delete_own" ON addresses
    FOR DELETE USING (user_owns_resource(user_id));

-- Product reviews table - users can read all, but only manage their own
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON product_reviews
    FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON product_reviews
    FOR INSERT WITH CHECK (user_owns_resource(user_id));

CREATE POLICY "reviews_update_own" ON product_reviews
    FOR UPDATE USING (user_owns_resource(user_id)) WITH CHECK (user_owns_resource(user_id));

CREATE POLICY "reviews_delete_own" ON product_reviews
    FOR DELETE USING (user_owns_resource(user_id));

-- Wishlist table - users can only access their own wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_select_own" ON wishlist
    FOR SELECT USING (user_owns_resource(user_id));

CREATE POLICY "wishlist_insert_own" ON wishlist
    FOR INSERT WITH CHECK (user_owns_resource(user_id));

CREATE POLICY "wishlist_delete_own" ON wishlist
    FOR DELETE USING (user_owns_resource(user_id));

-- Notifications table - users can only access their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (user_owns_resource(user_id));

CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (user_owns_resource(user_id)) WITH CHECK (user_owns_resource(user_id));

-- Website login sessions - allow creation and users can manage their own
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_sessions_select_own" ON website_login_sessions
    FOR SELECT USING (user_id IS NULL OR user_owns_resource(user_id));

CREATE POLICY "login_sessions_insert_all" ON website_login_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "login_sessions_update_own" ON website_login_sessions
    FOR UPDATE USING (user_id IS NULL OR user_owns_resource(user_id)) 
    WITH CHECK (user_id IS NULL OR user_owns_resource(user_id));

-- Public tables (no RLS needed, everyone can read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);

ALTER TABLE company ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_select_all" ON company FOR SELECT USING (true);

-- Telegram users table - allow all operations (used by webhook)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_users_all" ON telegram_users FOR ALL USING (true);

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION get_user_id_from_jwt() TO anon;
GRANT EXECUTE ON FUNCTION user_owns_resource(UUID) TO anon;

-- Show created policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
