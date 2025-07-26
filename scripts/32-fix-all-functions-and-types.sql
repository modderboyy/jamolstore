-- Fix all function return types and column references

-- Drop existing functions
DROP FUNCTION IF EXISTS search_all_content(text);
DROP FUNCTION IF EXISTS search_workers(text);
DROP FUNCTION IF EXISTS get_search_suggestions(text);
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
DROP FUNCTION IF EXISTS create_user_address(uuid, text, text, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS update_user_address(uuid, uuid, text, text, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS delete_user_address(uuid, uuid);

-- Create search_all_content function
CREATE OR REPLACE FUNCTION search_all_content(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price decimal,
  image_url text,
  category text,
  type text,
  rating decimal,
  reviews_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title::text,
    p.description::text,
    p.price,
    p.image_url::text,
    p.category::text,
    'product'::text as type,
    COALESCE(AVG(pr.rating), 0)::decimal as rating,
    COUNT(pr.id) as reviews_count
  FROM products p
  LEFT JOIN product_reviews pr ON p.id = pr.product_id
  WHERE 
    p.title ILIKE '%' || search_query || '%' 
    OR p.description ILIKE '%' || search_query || '%'
    OR p.category ILIKE '%' || search_query || '%'
  GROUP BY p.id, p.title, p.description, p.price, p.image_url, p.category
  
  UNION ALL
  
  SELECT 
    w.id,
    (w.first_name || ' ' || w.last_name)::text as title,
    w.specialization::text as description,
    w.hourly_rate as price,
    w.avatar_url::text as image_url,
    w.specialization::text as category,
    'worker'::text as type,
    COALESCE(w.rating, 0)::decimal as rating,
    w.reviews_count::bigint as reviews_count
  FROM workers w
  WHERE 
    w.first_name ILIKE '%' || search_query || '%' 
    OR w.last_name ILIKE '%' || search_query || '%'
    OR w.specialization ILIKE '%' || search_query || '%'
  ORDER BY rating DESC, reviews_count DESC
  LIMIT 20;
END;
$$;

-- Create search_workers function
CREATE OR REPLACE FUNCTION search_workers(search_query text)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  specialization text,
  hourly_rate decimal,
  rating decimal,
  reviews_count bigint,
  avatar_url text,
  is_available boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.first_name::text,
    w.last_name::text,
    w.specialization::text,
    w.hourly_rate,
    COALESCE(w.rating, 0)::decimal,
    w.reviews_count::bigint,
    w.avatar_url::text,
    w.is_available
  FROM workers w
  WHERE 
    w.first_name ILIKE '%' || search_query || '%' 
    OR w.last_name ILIKE '%' || search_query || '%'
    OR w.specialization ILIKE '%' || search_query || '%'
  ORDER BY w.rating DESC, w.reviews_count DESC
  LIMIT 10;
END;
$$;

-- Create get_search_suggestions function
CREATE OR REPLACE FUNCTION get_search_suggestions(search_query text)
RETURNS TABLE (
  suggestion text,
  type text,
  count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category::text as suggestion,
    'category'::text as type,
    COUNT(*)::bigint as count
  FROM products p
  WHERE p.category ILIKE '%' || search_query || '%'
  GROUP BY p.category
  
  UNION ALL
  
  SELECT 
    w.specialization::text as suggestion,
    'specialization'::text as type,
    COUNT(*)::bigint as count
  FROM workers w
  WHERE w.specialization ILIKE '%' || search_query || '%'
  GROUP BY w.specialization
  
  ORDER BY count DESC
  LIMIT 5;
END;
$$;

-- Create get_user_reviews function
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_title text,
  rating integer,
  comment text,
  created_at timestamp with time zone,
  product_image_url text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.product_id,
    p.title::text as product_title,
    pr.rating,
    pr.comment::text,
    pr.created_at,
    p.image_url::text as product_image_url
  FROM product_reviews pr
  JOIN products p ON pr.product_id = p.id
  WHERE pr.user_id = user_id_param
  ORDER BY pr.created_at DESC;
END;
$$;

-- Create get_user_addresses function
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  region text,
  district text,
  street text,
  house text,
  is_default boolean
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name::text,
    a.phone::text,
    a.region::text,
    a.district::text,
    a.street::text,
    a.house::text,
    a.is_default
  FROM addresses a
  WHERE a.user_id = user_id_param
  ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Create create_user_address function
CREATE OR REPLACE FUNCTION create_user_address(
  user_id_param uuid,
  name_param text,
  phone_param text,
  region_param text,
  district_param text,
  street_param text,
  house_param text,
  is_default_param boolean
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  new_address_id uuid;
BEGIN
  -- If this is set as default, unset all other defaults for this user
  IF is_default_param THEN
    UPDATE addresses 
    SET is_default = false 
    WHERE user_id = user_id_param;
  END IF;

  -- Insert new address
  INSERT INTO addresses (
    user_id, name, phone, region, district, street, house, is_default
  ) VALUES (
    user_id_param, name_param, phone_param, region_param, 
    district_param, street_param, house_param, is_default_param
  ) RETURNING id INTO new_address_id;

  RETURN new_address_id;
END;
$$;

-- Create update_user_address function
CREATE OR REPLACE FUNCTION update_user_address(
  address_id_param uuid,
  user_id_param uuid,
  name_param text,
  phone_param text,
  region_param text,
  district_param text,
  street_param text,
  house_param text,
  is_default_param boolean
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this is set as default, unset all other defaults for this user
  IF is_default_param THEN
    UPDATE addresses 
    SET is_default = false 
    WHERE user_id = user_id_param AND id != address_id_param;
  END IF;

  -- Update the address
  UPDATE addresses 
  SET 
    name = name_param,
    phone = phone_param,
    region = region_param,
    district = district_param,
    street = street_param,
    house = house_param,
    is_default = is_default_param,
    updated_at = NOW()
  WHERE id = address_id_param AND user_id = user_id_param;

  RETURN FOUND;
END;
$$;

-- Create delete_user_address function
CREATE OR REPLACE FUNCTION delete_user_address(
  address_id_param uuid,
  user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM addresses 
  WHERE id = address_id_param AND user_id = user_id_param;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_all_content(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_workers(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_user_address(uuid, text, text, text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_address(uuid, uuid, text, text, text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_user_address(uuid, uuid) TO anon, authenticated;
