-- Fix all database function errors and ambiguous column references

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS search_all_content(text, integer);
DROP FUNCTION IF EXISTS get_popular_searches(integer);

-- Fix get_user_reviews function with proper return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
    rating integer,
    comment text,
    created_at timestamp with time zone,
    product_id uuid,
    product_image text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        p.name_uz::text as product_name,
        r.rating,
        r.comment::text,
        r.created_at,
        r.product_id,
        COALESCE(p.images[1], '/placeholder.svg')::text as product_image
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = user_id_param
    ORDER BY r.created_at DESC;
END;
$$;

-- Fix get_user_addresses function with proper return types
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    title text,
    full_address text,
    phone text,
    is_default boolean,
    created_at timestamp with time zone
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title::text,
        a.full_address::text,
        a.phone::text,
        a.is_default,
        a.created_at
    FROM addresses a
    WHERE a.user_id = user_id_param
    ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix search_all_content function with proper column references
CREATE OR REPLACE FUNCTION search_all_content(search_term text, limit_count integer DEFAULT 20)
RETURNS TABLE (
    id uuid,
    title text,
    subtitle text,
    type text,
    image_url text,
    price numeric,
    category text,
    rating numeric,
    has_delivery boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Search products
    SELECT 
        p.id,
        p.name_uz::text as title,
        c.name_uz::text as subtitle,
        'product'::text as type,
        COALESCE(p.images[1], '/placeholder.svg')::text as image_url,
        p.price,
        c.name_uz::text as category,
        4.0::numeric + (random() * 1.0)::numeric as rating,
        p.has_delivery
    FROM products p
    JOIN categories c ON p.category_id = c.id
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
        w.id,
        (w.first_name || ' ' || w.last_name)::text as title,
        w.specialization::text as subtitle,
        'worker'::text as type,
        COALESCE(w.profile_image, '/placeholder-user.jpg')::text as image_url,
        w.hourly_rate,
        w.specialization::text as category,
        4.0::numeric + (random() * 1.0)::numeric as rating,
        false as has_delivery
    FROM workers w
    WHERE w.is_available = true
    AND (
        w.first_name ILIKE '%' || search_term || '%' 
        OR w.last_name ILIKE '%' || search_term || '%'
        OR w.specialization ILIKE '%' || search_term || '%'
        OR w.bio ILIKE '%' || search_term || '%'
    )
    
    ORDER BY 
        CASE 
            WHEN title ILIKE search_term || '%' THEN 1
            WHEN title ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        title
    LIMIT limit_count;
END;
$$;

-- Fix get_popular_searches function
CREATE OR REPLACE FUNCTION get_popular_searches(limit_count integer DEFAULT 10)
RETURNS TABLE (
    query text,
    search_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.query::text,
        COUNT(*)::bigint as search_count
    FROM search_history s
    WHERE s.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY s.query
    ORDER BY search_count DESC, s.query
    LIMIT limit_count;
END;
$$;

-- Create search_history table if not exists
CREATE TABLE IF NOT EXISTS search_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    query text NOT NULL,
    user_id uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);

-- Insert some sample popular searches
INSERT INTO search_history (query) VALUES 
('qurilish materiallari'),
('elektrik'),
('santexnik'),
('bo''yoq'),
('plitka'),
('cement'),
('metall'),
('yog''och')
ON CONFLICT DO NOTHING;

-- Fix increment_product_view function
CREATE OR REPLACE FUNCTION increment_product_view(product_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products 
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = product_id_param;
END;
$$;

-- Add view_count column if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_all_content(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_searches(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON search_history TO authenticated;
