-- Fix all SQL functions with proper types and column references

-- Drop existing functions first
DROP FUNCTION IF EXISTS search_all_content(text, integer);
DROP FUNCTION IF EXISTS get_popular_searches(integer);
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS increment_product_view(uuid);
DROP FUNCTION IF EXISTS get_search_suggestions(text, integer);

-- Create search_all_content function with proper return type
CREATE OR REPLACE FUNCTION search_all_content(
  search_term text,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id text,
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
    p.id::text,
    p.name_uz as title,
    c.name_uz as subtitle,
    'product'::text as type,
    COALESCE(p.images[1], '')::text as image_url,
    p.price,
    c.name_uz as category,
    4.0::numeric as rating,
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
    w.id::text,
    w.full_name as title,
    w.specialization as subtitle,
    'worker'::text as type,
    COALESCE(w.profile_image, '')::text as image_url,
    w.hourly_rate as price,
    w.specialization as category,
    COALESCE(w.rating, 4.0)::numeric as rating,
    false as has_delivery
  FROM workers w
  WHERE w.is_available = true
    AND (
      w.full_name ILIKE '%' || search_term || '%'
      OR w.specialization ILIKE '%' || search_term || '%'
      OR w.bio ILIKE '%' || search_term || '%'
    )
  
  ORDER BY rating DESC
  LIMIT limit_count;
END;
$$;

-- Create get_popular_searches function
CREATE OR REPLACE FUNCTION get_popular_searches(limit_count integer DEFAULT 10)
RETURNS TABLE (
  query text,
  count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Qurilish materiallari'::text as query, 
    100::bigint as count
  UNION ALL
  SELECT 'Elektr jihozlari'::text, 85::bigint
  UNION ALL
  SELECT 'Santexnika'::text, 70::bigint
  UNION ALL
  SELECT 'Bo''yoq va lak'::text, 65::bigint
  UNION ALL
  SELECT 'Asboblar'::text, 60::bigint
  UNION ALL
  SELECT 'Dekorativ materiallar'::text, 55::bigint
  UNION ALL
  SELECT 'Oshxona jihozlari'::text, 50::bigint
  UNION ALL
  SELECT 'Vannaxona aksessuarlari'::text, 45::bigint
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$;

-- Create get_user_reviews function with proper return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  product_name text,
  rating integer,
  comment text,
  created_at timestamp with time zone,
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
    COALESCE(p.images[1], '')::text as product_image
  FROM product_reviews r
  LEFT JOIN products p ON r.product_id = p.id
  WHERE r.customer_id = user_id_param
  ORDER BY r.created_at DESC;
END;
$$;

-- Create get_user_addresses function with proper return types
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  title text,
  address text,
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
    a.address::text,
    a.is_default,
    a.created_at
  FROM addresses a
  WHERE a.user_id = user_id_param
  ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Create increment_product_view function
CREATE OR REPLACE FUNCTION increment_product_view(product_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update product view
  INSERT INTO product_views (product_id, view_count, last_viewed)
  VALUES (product_id_param, 1, NOW())
  ON CONFLICT (product_id)
  DO UPDATE SET 
    view_count = product_views.view_count + 1,
    last_viewed = NOW();
    
  -- Update product view count
  UPDATE products 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = product_id_param;
END;
$$;

-- Create get_search_suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(
  search_term text,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  type text,
  count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Product name suggestions
  SELECT DISTINCT
    p.name_uz::text as suggestion,
    'product'::text as type,
    COUNT(*)::bigint as count
  FROM products p
  WHERE p.name_uz ILIKE '%' || search_term || '%'
    AND p.is_available = true
  GROUP BY p.name_uz
  
  UNION ALL
  
  -- Category suggestions
  SELECT DISTINCT
    c.name_uz::text as suggestion,
    'category'::text as type,
    COUNT(p.id)::bigint as count
  FROM categories c
  LEFT JOIN products p ON c.id = p.category_id
  WHERE c.name_uz ILIKE '%' || search_term || '%'
    AND c.is_active = true
  GROUP BY c.name_uz
  
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_all_content(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_popular_searches(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(text, integer) TO anon, authenticated;
