-- Fix all database function errors and add real-time search

-- Drop existing functions to recreate them with correct types
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS search_products_fuzzy(text, int);
DROP FUNCTION IF EXISTS get_search_suggestions(text, int);
DROP FUNCTION IF EXISTS increment_product_view(uuid, text);

-- Fix get_user_reviews function with correct return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  product_name text,
  rating integer,
  comment text,
  created_at timestamptz,
  product_id uuid,
  product_image text
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
    p.image_url::text as product_image
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
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enhanced fuzzy search function
CREATE OR REPLACE FUNCTION search_products_fuzzy(search_term text, limit_count int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price decimal,
  image_url text,
  category text,
  view_count integer,
  rating decimal,
  similarity real
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable pg_trgm extension if not exists
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name::text,
    p.description::text,
    p.price,
    p.image_url::text,
    p.category::text,
    COALESCE(p.view_count, 0) as view_count,
    COALESCE(
      (SELECT AVG(rating)::decimal FROM reviews WHERE product_id = p.id), 
      0
    ) as rating,
    GREATEST(
      similarity(p.name::text, search_term),
      similarity(p.description::text, search_term),
      similarity(p.category::text, search_term)
    ) as similarity
  FROM products p
  WHERE 
    p.is_active = true
    AND (
      p.name ILIKE '%' || search_term || '%'
      OR p.description ILIKE '%' || search_term || '%'
      OR p.category ILIKE '%' || search_term || '%'
      OR similarity(p.name::text, search_term) > 0.1
      OR similarity(p.description::text, search_term) > 0.1
    )
  ORDER BY 
    similarity DESC,
    p.view_count DESC,
    p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term text, limit_count int DEFAULT 5)
RETURNS TABLE (
  suggestion text,
  category text,
  count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.name::text as suggestion,
    p.category::text,
    COUNT(*) OVER (PARTITION BY p.name) as count
  FROM products p
  WHERE 
    p.is_active = true
    AND (
      p.name ILIKE '%' || search_term || '%'
      OR p.category ILIKE '%' || search_term || '%'
    )
  ORDER BY count DESC, suggestion
  LIMIT limit_count;
END;
$$;

-- Simple increment view function
CREATE OR REPLACE FUNCTION increment_product_view(product_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products 
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    last_viewed_at = NOW()
  WHERE id = product_id_param;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_products_fuzzy(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO anon, authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_search_gin ON products USING gin(to_tsvector('russian', name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON products USING gin(category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
