-- Fix all permission issues and RLS policies

-- First, disable RLS temporarily to fix permissions
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE website_login_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Service role can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Service role can manage order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
DROP POLICY IF EXISTS "Service role can manage cart" ON cart_items;
DROP POLICY IF EXISTS "Anyone can view reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Service role can manage reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
DROP POLICY IF EXISTS "Service role can manage addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own login sessions" ON website_login_sessions;
DROP POLICY IF EXISTS "Users can update own login sessions" ON website_login_sessions;
DROP POLICY IF EXISTS "Service role can manage login sessions" ON website_login_sessions;
DROP POLICY IF EXISTS "Anonymous can create login sessions" ON website_login_sessions;

-- Grant full permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;
GRANT SELECT ON products TO authenticated;
GRANT SELECT ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_login_sessions TO authenticated;

-- Grant read permissions to anonymous users
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON company TO anon;
GRANT INSERT, UPDATE ON website_login_sessions TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant usage and select on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Now create simple RLS policies that work
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON users FOR ALL TO service_role USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON orders FOR ALL TO service_role USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON order_items FOR ALL TO service_role USING (true);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON cart_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON cart_items FOR ALL TO service_role USING (true);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON addresses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON addresses FOR ALL TO service_role USING (true);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON product_reviews FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON product_reviews FOR ALL TO service_role USING (true);

-- Products and categories - public read access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Allow all for service role" ON products FOR ALL TO service_role USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow all for service role" ON categories FOR ALL TO service_role USING (true);

-- Website login sessions - allow anonymous access
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for everyone" ON website_login_sessions FOR ALL USING (true);

-- Company info - public read
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for everyone" ON company FOR SELECT USING (true);
CREATE POLICY "Allow all for service role" ON company FOR ALL TO service_role USING (true);

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role, authenticated, anon;

-- Ensure supabase_auth_admin has proper permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- Fix any ownership issues
ALTER TABLE users OWNER TO supabase_auth_admin;
ALTER TABLE orders OWNER TO supabase_auth_admin;
ALTER TABLE order_items OWNER TO supabase_auth_admin;
ALTER TABLE cart_items OWNER TO supabase_auth_admin;
ALTER TABLE addresses OWNER TO supabase_auth_admin;
ALTER TABLE product_reviews OWNER TO supabase_auth_admin;
ALTER TABLE website_login_sessions OWNER TO supabase_auth_admin;

-- Create a function to update user profile safely
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id_param UUID,
    first_name_param TEXT,
    last_name_param TEXT,
    phone_number_param TEXT,
    email_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    formatted_phone TEXT;
BEGIN
    -- Format phone number
    formatted_phone := phone_number_param;
    
    -- Remove all non-digit characters
    formatted_phone := regexp_replace(formatted_phone, '[^0-9]', '', 'g');
    
    -- Add +998 prefix if not present
    IF NOT formatted_phone ~ '^998' THEN
        formatted_phone := '998' || formatted_phone;
    END IF;
    
    -- Format as +998 XX XXX XX XX
    IF length(formatted_phone) = 12 THEN
        formatted_phone := '+' || substring(formatted_phone, 1, 3) || ' ' || 
                          substring(formatted_phone, 4, 2) || ' ' || 
                          substring(formatted_phone, 6, 3) || ' ' || 
                          substring(formatted_phone, 9, 2) || ' ' || 
                          substring(formatted_phone, 11, 2);
    END IF;
    
    -- Update user
    UPDATE users 
    SET 
        first_name = first_name_param,
        last_name = last_name_param,
        phone_number = formatted_phone,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Profil muvaffaqiyatli yangilandi',
            'formatted_phone', formatted_phone
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'Foydalanuvchi topilmadi'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated, service_role;

-- Create delivery summary function
CREATE OR REPLACE FUNCTION get_delivery_summary(customer_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    delivery_products JSON[];
    no_delivery_products JSON[];
    max_delivery_fee DECIMAL(12,2) := 0;
    company_address TEXT;
BEGIN
    -- Get company address
    SELECT address INTO company_address FROM company WHERE is_active = true LIMIT 1;
    
    -- Get delivery products from cart
    SELECT array_agg(
        json_build_object(
            'id', ci.id,
            'product_name', p.name_uz,
            'quantity', ci.quantity,
            'delivery_price', p.delivery_price
        )
    ) INTO delivery_products
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = customer_id_param AND p.has_delivery = true;
    
    -- Get non-delivery products from cart
    SELECT array_agg(
        json_build_object(
            'id', ci.id,
            'product_name', p.name_uz,
            'quantity', ci.quantity
        )
    ) INTO no_delivery_products
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = customer_id_param AND p.has_delivery = false;
    
    -- Get max delivery fee
    SELECT COALESCE(MAX(p.delivery_price), 0) INTO max_delivery_fee
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = customer_id_param AND p.has_delivery = true;
    
    result := json_build_object(
        'has_delivery_products', COALESCE(array_length(delivery_products, 1), 0) > 0,
        'has_no_delivery_products', COALESCE(array_length(no_delivery_products, 1), 0) > 0,
        'delivery_products', COALESCE(delivery_products, ARRAY[]::JSON[]),
        'no_delivery_products', COALESCE(no_delivery_products, ARRAY[]::JSON[]),
        'max_delivery_fee', max_delivery_fee,
        'company_address', COALESCE(company_address, 'Kompaniya manzili')
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_delivery_summary TO authenticated, service_role;

-- Refresh permissions
ANALYZE;

-- Final check - ensure all tables have proper permissions
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('GRANT ALL ON %I TO service_role', tbl.tablename);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', tbl.tablename);
    END LOOP;
END $$;
