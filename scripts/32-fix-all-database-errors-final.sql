-- Fix all database function errors and ambiguous column references

-- Drop existing functions to recreate them with proper types
DROP FUNCTION IF EXISTS get_user_reviews(UUID);
DROP FUNCTION IF EXISTS get_user_addresses(UUID);
DROP FUNCTION IF EXISTS search_all_content(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_popular_searches(INTEGER);

-- Fix get_user_reviews function with proper return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    product_name TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    product_image TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        p.name_uz::TEXT as product_name,
        r.rating,
        r.comment::TEXT,
        r.created_at,
        COALESCE(p.images[1], '/placeholder.svg')::TEXT as product_image
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = user_id_param
    ORDER BY r.created_at DESC;
END;
$$;

-- Fix get_user_addresses function with proper return types
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    full_address TEXT,
    phone TEXT,
    is_default BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title::TEXT,
        a.full_address::TEXT,
        a.phone::TEXT,
        a.is_default,
        a.created_at
    FROM user_addresses a
    WHERE a.user_id = user_id_param
    ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix search_all_content function with proper column references
CREATE OR REPLACE FUNCTION search_all_content(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    subtitle TEXT,
    type TEXT,
    image_url TEXT,
    price NUMERIC,
    category TEXT,
    rating NUMERIC,
    has_delivery BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Search products
    SELECT 
        p.id::TEXT,
        p.name_uz::TEXT as title,
        COALESCE(p.description_uz, '')::TEXT as subtitle,
        'product'::TEXT as type,
        COALESCE(p.images[1], '/placeholder.svg')::TEXT as image_url,
        p.price,
        c.name_uz::TEXT as category,
        COALESCE(4.0 + random(), 4.0)::NUMERIC as rating,
        p.has_delivery
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_available = true 
    AND p.stock_quantity > 0
    AND (
        p.name_uz ILIKE '%' || search_term || '%' 
        OR p.description_uz ILIKE '%' || search_term || '%'
        OR c.name_uz ILIKE '%' || search_term || '%'
    )
    
    UNION ALL
    
    -- Search workers
    SELECT 
        w.id::TEXT,
        (w.first_name || ' ' || w.last_name)::TEXT as title,
        w.specialization::TEXT as subtitle,
        'worker'::TEXT as type,
        COALESCE(w.profile_image, '/placeholder-user.jpg')::TEXT as image_url,
        w.hourly_rate,
        w.specialization::TEXT as category,
        COALESCE(w.rating, 4.0)::NUMERIC as rating,
        false as has_delivery
    FROM workers w
    WHERE w.is_available = true
    AND (
        w.first_name ILIKE '%' || search_term || '%' 
        OR w.last_name ILIKE '%' || search_term || '%'
        OR w.specialization ILIKE '%' || search_term || '%'
        OR w.bio ILIKE '%' || search_term || '%'
    )
    
    ORDER BY rating DESC
    LIMIT limit_count;
END;
$$;

-- Fix get_popular_searches function
CREATE OR REPLACE FUNCTION get_popular_searches(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.query::TEXT,
        ss.search_count
    FROM search_suggestions ss
    WHERE ss.search_count > 0
    ORDER BY ss.search_count DESC, ss.updated_at DESC
    LIMIT limit_count;
END;
$$;

-- Create increment_product_view function if not exists
CREATE OR REPLACE FUNCTION increment_product_view(product_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products 
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = product_id_param;
END;
$$;

-- Add view_count column to products if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'view_count') THEN
        ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create search_suggestions table if not exists
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL UNIQUE,
    search_count BIGINT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample popular searches
INSERT INTO search_suggestions (query, search_count) VALUES
('qurilish materiallari', 150),
('elektr asboblari', 120),
('santexnika', 100),
('bo''yoq', 80),
('sim', 75),
('truba', 65),
('plitka', 60),
('laminat', 55)
ON CONFLICT (query) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple', name_uz || ' ' || COALESCE(description_uz, '')));
CREATE INDEX IF NOT EXISTS idx_workers_search ON workers USING gin(to_tsvector('simple', first_name || ' ' || last_name || ' ' || specialization || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_count ON search_suggestions(search_count DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_reviews(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_all_content(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_popular_searches(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view(UUID) TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON search_suggestions TO anon, authenticated;
