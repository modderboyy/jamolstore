-- Fix all database function errors and ambiguous column references

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS search_products_fuzzy(text);

-- Fix get_user_reviews function with correct return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
    rating integer,
    comment text,
    created_at timestamp with time zone,
    product_id uuid,
    product_image_url text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        p.name::text as product_name,
        r.rating,
        r.comment::text,
        r.created_at,
        r.product_id,
        p.image_url::text as product_image_url
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = user_id_param
    ORDER BY r.created_at DESC;
END;
$$;

-- Fix get_user_addresses function with correct return types
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

-- Fix search_products_fuzzy function with proper column references
CREATE OR REPLACE FUNCTION search_products_fuzzy(search_term text)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    price numeric,
    image_url text,
    category_id uuid,
    category_name text,
    is_available boolean,
    stock_quantity integer,
    similarity_score real
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name::text,
        p.description::text,
        p.price,
        p.image_url::text,
        p.category_id,
        c.name::text as category_name,
        p.is_available,
        p.stock_quantity,
        GREATEST(
            similarity(p.name::text, search_term),
            similarity(p.description::text, search_term),
            similarity(c.name::text, search_term)
        ) as similarity_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        p.is_available = true
        AND (
            p.name ILIKE '%' || search_term || '%'
            OR p.description ILIKE '%' || search_term || '%'
            OR c.name ILIKE '%' || search_term || '%'
            OR similarity(p.name::text, search_term) > 0.3
            OR similarity(p.description::text, search_term) > 0.3
            OR similarity(c.name::text, search_term) > 0.3
        )
    ORDER BY similarity_score DESC, p.name
    LIMIT 50;
END;
$$;

-- Fix get_product_suggestions function
CREATE OR REPLACE FUNCTION get_product_suggestions(search_term text)
RETURNS TABLE (
    suggestion text,
    category text,
    match_type text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Product name suggestions
    SELECT DISTINCT 
        p.name::text as suggestion,
        c.name::text as category,
        'product'::text as match_type
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.name ILIKE '%' || search_term || '%'
        AND p.is_available = true
    
    UNION ALL
    
    -- Category suggestions
    SELECT DISTINCT 
        c.name::text as suggestion,
        c.name::text as category,
        'category'::text as match_type
    FROM categories c
    WHERE c.name ILIKE '%' || search_term || '%'
        AND c.is_active = true
    
    ORDER BY suggestion
    LIMIT 10;
END;
$$;

-- Ensure pg_trgm extension is enabled for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON categories USING gin (name gin_trgm_ops);

-- Update RLS policies to ensure proper access
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Reviews policies
DROP POLICY IF EXISTS "Users can view all reviews" ON reviews;
CREATE POLICY "Users can view all reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Addresses policies  
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
CREATE POLICY "Users can view their own addresses" ON addresses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
CREATE POLICY "Users can insert their own addresses" ON addresses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
CREATE POLICY "Users can update their own addresses" ON addresses FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_products_fuzzy(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_suggestions(text) TO anon, authenticated;
