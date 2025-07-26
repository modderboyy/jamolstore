-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS update_user_profile(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS get_search_suggestions(text);
DROP FUNCTION IF EXISTS search_all_content(text, integer);

-- Fix get_user_reviews function with correct return types
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE(
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

-- Fix get_user_addresses function with correct return types
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE(
  id uuid,
  title text,
  full_address text,
  phone_number text,
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
    a.phone_number::text,
    a.is_default,
    a.created_at
  FROM addresses a
  WHERE a.user_id = user_id_param
  ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix update_user_profile function with proper column references
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id_param uuid,
  first_name_param text DEFAULT NULL,
  last_name_param text DEFAULT NULL,
  phone_number_param text DEFAULT NULL,
  email_param text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  telegram_id text,
  first_name text,
  last_name text,
  username text,
  phone_number text,
  email text,
  avatar_url text,
  is_verified boolean,
  role text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET 
    first_name = COALESCE(first_name_param, users.first_name),
    last_name = COALESCE(last_name_param, users.last_name),
    phone_number = COALESCE(phone_number_param, users.phone_number),
    email = COALESCE(email_param, users.email),
    updated_at = NOW()
  WHERE users.id = user_id_param;

  RETURN QUERY
  SELECT 
    u.id,
    u.telegram_id::text,
    u.first_name::text,
    u.last_name::text,
    u.username::text,
    u.phone_number::text,
    u.email::text,
    u.avatar_url::text,
    u.is_verified,
    u.role::text,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.id = user_id_param;
END;
$$;

-- Fix search suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(search_term text)
RETURNS TABLE(suggestion text, type text, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  (
    -- Product suggestions
    SELECT 
      p.name_uz::text as suggestion,
      'product'::text as type,
      COUNT(*)::bigint as count
    FROM products p
    WHERE p.is_available = true
      AND p.stock_quantity > 0
      AND p.name_uz ILIKE '%' || search_term || '%'
    GROUP BY p.name_uz
    ORDER BY count DESC, p.name_uz
    LIMIT 5
  )
  UNION ALL
  (
    -- Category suggestions
    SELECT 
      c.name_uz::text as suggestion,
      'category'::text as type,
      COUNT(p.id)::bigint as count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_available = true
    WHERE c.name_uz ILIKE '%' || search_term || '%'
    GROUP BY c.name_uz
    ORDER BY count DESC, c.name_uz
    LIMIT 5
  )
  ORDER BY count DESC, suggestion
  LIMIT 10;
END;
$$;

-- Fix search_all_content function with proper return types
CREATE OR REPLACE FUNCTION search_all_content(
  search_term text,
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
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
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  (
    -- Search products
    SELECT 
      p.id,
      p.name_uz::text as title,
      p.description::text as subtitle,
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
        p.name_uz ILIKE '%' || search_term || '%' OR
        p.description ILIKE '%' || search_term || '%' OR
        c.name_uz ILIKE '%' || search_term || '%'
      )
    ORDER BY 
      CASE WHEN p.name_uz ILIKE search_term || '%' THEN 1 ELSE 2 END,
      p.is_featured DESC,
      p.is_popular DESC
    LIMIT limit_count / 2
  )
  UNION ALL
  (
    -- Search workers
    SELECT 
      w.id,
      (w.first_name || ' ' || w.last_name)::text as title,
      w.specialization::text as subtitle,
      'worker'::text as type,
      COALESCE(w.avatar_url, '/placeholder-user.jpg')::text as image_url,
      w.hourly_rate,
      w.specialization::text as category,
      w.rating,
      false as has_delivery
    FROM workers w
    WHERE w.is_available = true
      AND (
        w.first_name ILIKE '%' || search_term || '%' OR
        w.last_name ILIKE '%' || search_term || '%' OR
        w.specialization ILIKE '%' || search_term || '%' OR
        w.description ILIKE '%' || search_term || '%'
      )
    ORDER BY w.rating DESC, w.created_at DESC
    LIMIT limit_count / 2
  )
  ORDER BY 
    CASE WHEN type = 'product' THEN 1 ELSE 2 END,
    rating DESC
  LIMIT limit_count;
END;
$$;

-- Create real-time search function for instant results
CREATE OR REPLACE FUNCTION get_instant_search_results(
  search_term text,
  limit_count integer DEFAULT 8
)
RETURNS TABLE(
  id uuid,
  title text,
  type text,
  image_url text,
  price numeric,
  category text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF LENGTH(TRIM(search_term)) < 1 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name_uz::text as title,
    'product'::text as type,
    COALESCE(p.images[1], '/placeholder.svg')::text as image_url,
    p.price,
    c.name_uz::text as category
  FROM products p
  JOIN categories c ON p.category_id = c.id
  WHERE p.is_available = true
    AND p.stock_quantity > 0
    AND p.name_uz ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE WHEN p.name_uz ILIKE search_term || '%' THEN 1 ELSE 2 END,
    p.is_featured DESC,
    p.view_count DESC
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_all_content(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_instant_search_results(text, integer) TO anon, authenticated;
