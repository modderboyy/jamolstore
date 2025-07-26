-- Fix permissions and RLS for anonymous users (no Supabase Auth)
-- This script fixes the 42501 permission denied errors

-- First, disable RLS temporarily to make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE website_login_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Orders are viewable by owner" ON orders;
DROP POLICY IF EXISTS "Orders can be created by authenticated users" ON orders;
DROP POLICY IF EXISTS "Order items are viewable by order owner" ON order_items;
DROP POLICY IF EXISTS "Order items can be created with orders" ON order_items;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Cart items are viewable by owner" ON cart_items;
DROP POLICY IF EXISTS "Cart items can be managed by owner" ON cart_items;
DROP POLICY IF EXISTS "Addresses are viewable by owner" ON addresses;
DROP POLICY IF EXISTS "Addresses can be managed by owner" ON addresses;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Reviews can be created by authenticated users" ON reviews;
DROP POLICY IF EXISTS "Wishlist items are viewable by owner" ON wishlist;
DROP POLICY IF EXISTS "Wishlist items can be managed by owner" ON wishlist;
DROP POLICY IF EXISTS "Notifications are viewable by owner" ON notifications;
DROP POLICY IF EXISTS "Notifications can be managed by owner" ON notifications;
DROP POLICY IF EXISTS "Telegram users can be viewed and managed" ON telegram_users;
DROP POLICY IF EXISTS "Website login sessions can be managed" ON website_login_sessions;

-- Grant full permissions to anon role (since we don't use Supabase Auth)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Grant permissions to authenticated role as well (just in case)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create simple policies that allow all operations for anon users
-- Since we handle authentication in our app logic, not Supabase Auth

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Orders table  
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON orders
    FOR ALL USING (true) WITH CHECK (true);

-- Order items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON order_items
    FOR ALL USING (true) WITH CHECK (true);

-- Products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON products
    FOR ALL USING (true) WITH CHECK (true);

-- Categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON categories
    FOR ALL USING (true) WITH CHECK (true);

-- Cart items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON cart_items
    FOR ALL USING (true) WITH CHECK (true);

-- Addresses table
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON addresses
    FOR ALL USING (true) WITH CHECK (true);

-- Reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON reviews
    FOR ALL USING (true) WITH CHECK (true);

-- Wishlist table
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON wishlist
    FOR ALL USING (true) WITH CHECK (true);

-- Notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Telegram users table
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON telegram_users
    FOR ALL USING (true) WITH CHECK (true);

-- Website login sessions table
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon users" ON website_login_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Additional tables that might exist
DO $$
BEGIN
    -- Product variations
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_variations') THEN
        ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON product_variations;
        CREATE POLICY "Allow all operations for anon users" ON product_variations
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Stock
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock') THEN
        ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON stock;
        CREATE POLICY "Allow all operations for anon users" ON stock
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Companies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON companies;
        CREATE POLICY "Allow all operations for anon users" ON companies
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Rental products
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rental_products') THEN
        ALTER TABLE rental_products ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON rental_products;
        CREATE POLICY "Allow all operations for anon users" ON rental_products
            FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Rental orders
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rental_orders') THEN
        ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations for anon users" ON rental_orders;
        CREATE POLICY "Allow all operations for anon users" ON rental_orders
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Make sure anon role can execute functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Update default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Verify permissions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('GRANT ALL ON TABLE %I TO anon', r.tablename);
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', r.tablename);
        EXECUTE format('GRANT ALL ON TABLE %I TO service_role', r.tablename);
    END LOOP;
END $$;

-- Show current policies (for verification)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Show table permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
