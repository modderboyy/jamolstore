-- Fix get_search_suggestions function type mismatch
DROP FUNCTION IF EXISTS get_search_suggestions(text);

CREATE OR REPLACE FUNCTION get_search_suggestions(search_term text)
RETURNS TABLE(suggestion text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name::text as suggestion
  FROM products p
  WHERE p.name ILIKE '%' || search_term || '%'
    AND p.is_active = true
  ORDER BY suggestion
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create product view increment function with bot protection
CREATE OR REPLACE FUNCTION increment_product_view(product_id_param uuid, user_agent text DEFAULT '')
RETURNS void AS $$
DECLARE
  is_bot boolean := false;
BEGIN
  -- Check if user agent indicates a bot
  IF user_agent ILIKE '%bot%' OR 
     user_agent ILIKE '%crawler%' OR 
     user_agent ILIKE '%spider%' OR
     user_agent = '' THEN
    is_bot := true;
  END IF;

  -- Only increment if not a bot
  IF NOT is_bot THEN
    UPDATE products 
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = product_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure profile update function
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
) AS $$
BEGIN
  UPDATE users 
  SET 
    first_name = COALESCE(first_name_param, first_name),
    last_name = COALESCE(last_name_param, last_name),
    phone_number = COALESCE(phone_number_param, phone_number),
    email = COALESCE(email_param, email),
    updated_at = NOW()
  WHERE users.id = user_id_param;

  RETURN QUERY
  SELECT 
    u.id,
    u.telegram_id,
    u.first_name,
    u.last_name,
    u.username,
    u.phone_number,
    u.email,
    u.avatar_url,
    u.is_verified,
    u.role,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_search_suggestions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(uuid, text, text, text, text) TO anon, authenticated;
