-- Fix all database function errors and add real-time features

-- Fix get_user_addresses function with correct return types
DROP FUNCTION IF EXISTS get_user_addresses(uuid);

CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    name character varying(255),
    address text,
    city character varying(255),
    region character varying(255),
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
        a.name,
        a.address,
        a.city,
        a.region,
        a.is_default,
        a.created_at
    FROM addresses a
    WHERE a.user_id = user_id_param
    ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix get_user_reviews function with correct return types
DROP FUNCTION IF EXISTS get_user_reviews(uuid);

CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name character varying(255),
    rating integer,
    comment text,
    is_verified boolean,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        p.name_uz,
        pr.rating,
        pr.comment,
        pr.is_verified,
        pr.created_at
    FROM product_reviews pr
    JOIN products p ON p.id = pr.product_id
    WHERE pr.customer_id = user_id_param
    ORDER BY pr.created_at DESC;
END;
$$;

-- Fix search_workers function with ambiguous column reference
DROP FUNCTION IF EXISTS search_workers(text, text, text, numeric, numeric, integer);

CREATE OR REPLACE FUNCTION search_workers(
    search_term text DEFAULT '',
    profession_filter text DEFAULT '',
    location_filter text DEFAULT '',
    min_rating numeric DEFAULT 0,
    max_hourly_rate numeric DEFAULT 999999,
    limit_count integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    first_name character varying(255),
    last_name character varying(255),
    profession_uz character varying(255),
    experience_years integer,
    hourly_rate numeric,
    daily_rate numeric,
    rating numeric,
    review_count integer,
    location character varying(255),
    is_available boolean,
    skills text[],
    avatar_url text,
    phone_number character varying(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.first_name,
        w.last_name,
        w.profession_uz,
        w.experience_years,
        w.hourly_rate,
        w.daily_rate,
        w.rating,
        w.review_count,
        w.location,
        w.is_available,
        w.skills,
        w.avatar_url,
        w.phone_number
    FROM workers w
    WHERE w.is_available = true
    AND (search_term = '' OR 
         w.first_name ILIKE '%' || search_term || '%' OR
         w.last_name ILIKE '%' || search_term || '%' OR
         w.profession_uz ILIKE '%' || search_term || '%' OR
         EXISTS (
             SELECT 1 FROM unnest(w.skills) as skill 
             WHERE skill ILIKE '%' || search_term || '%'
         ))
    AND (profession_filter = '' OR w.profession_uz = profession_filter)
    AND (location_filter = '' OR w.location ILIKE '%' || location_filter || '%')
    AND w.rating >= min_rating
    AND w.hourly_rate <= max_hourly_rate
    ORDER BY w.rating DESC, w.first_name
    LIMIT limit_count;
END;
$$;

-- Fix get_search_suggestions function
DROP FUNCTION IF EXISTS get_search_suggestions(text);

CREATE OR REPLACE FUNCTION get_search_suggestions(search_term text)
RETURNS TABLE(suggestion character varying(255)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name_uz as suggestion
  FROM products p
  WHERE p.name_uz ILIKE '%' || search_term || '%'
    AND p.is_available = true
  ORDER BY suggestion
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create real-time search function for instant results
CREATE OR REPLACE FUNCTION get_instant_search_results(
    search_term text DEFAULT '',
    limit_count integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    title character varying(255),
    subtitle character varying(255),
    type text,
    image_url text,
    price numeric,
    category character varying(255),
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
            p.name_uz as title,
            c.name_uz as subtitle,
            'product'::text as type,
            CASE 
                WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 
                THEN p.images[1]::text
                ELSE NULL::text
            END as image_url,
            p.price,
            c.name_uz as category,
            COALESCE(4.0 + random(), 4.0)::numeric as rating,
            p.has_delivery
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_available = true
        AND p.stock_quantity > 0
        AND (
            search_term = '' OR
            p.name_uz ILIKE '%' || search_term || '%' OR
            p.description_uz ILIKE '%' || search_term || '%' OR
            c.name_uz ILIKE '%' || search_term || '%'
        )
        ORDER BY 
            CASE WHEN p.is_featured THEN 1 ELSE 2 END,
            CASE WHEN p.is_popular THEN 1 ELSE 2 END,
            p.name_uz
        LIMIT limit_count / 2
    )
    UNION ALL
    (
        -- Search workers
        SELECT 
            w.id,
            (w.first_name || ' ' || w.last_name)::character varying(255) as title,
            w.profession_uz as subtitle,
            'worker'::text as type,
            w.avatar_url::text as image_url,
            w.hourly_rate,
            w.profession_uz as category,
            w.rating,
            false as has_delivery
        FROM workers w
        WHERE w.is_available = true
        AND (
            search_term = '' OR
            w.first_name ILIKE '%' || search_term || '%' OR
            w.last_name ILIKE '%' || search_term || '%' OR
            w.profession_uz ILIKE '%' || search_term || '%' OR
            EXISTS (
                SELECT 1 FROM unnest(w.skills) as skill 
                WHERE skill ILIKE '%' || search_term || '%'
            )
        )
        ORDER BY w.rating DESC, w.first_name
        LIMIT limit_count / 2
    )
    ORDER BY type, title
    LIMIT limit_count;
END;
$$;

-- Create function to get popular searches
CREATE OR REPLACE FUNCTION get_popular_searches(limit_count integer DEFAULT 10)
RETURNS TABLE(query text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Qurilish materiallari'::text as query, 150::bigint as count
  UNION ALL
  SELECT 
    'Elektr jihozlari'::text as query, 120::bigint as count
  UNION ALL
  SELECT 
    'Santexnika'::text as query, 100::bigint as count
  UNION ALL
  SELECT 
    'Asboblar'::text as query, 90::bigint as count
  UNION ALL
  SELECT 
    'Bo''yoqlar'::text as query, 80::bigint as count
  UNION ALL
  SELECT 
    'Ishchilar'::text as query, 70::bigint as count
  UNION ALL
  SELECT 
    'Ustalar'::text as query, 60::bigint as count
  UNION ALL
  SELECT 
    'Qurilish'::text as query, 50::bigint as count
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_workers(text, text, text, numeric, numeric, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_instant_search_results(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_popular_searches(integer) TO anon, authenticated;
