-- Fix search_all_content function
DROP FUNCTION IF EXISTS search_all_content(text, integer);

CREATE OR REPLACE FUNCTION search_all_content(
    search_term text DEFAULT '',
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
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    (
        -- Search products
        SELECT 
            p.id::text,
            p.name_uz::text as title,
            c.name_uz::text as subtitle,
            'product'::text as type,
            CASE 
                WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 
                THEN p.images[1]::text
                ELSE NULL::text
            END as image_url,
            p.price,
            c.name_uz::text as category,
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
            w.id::text,
            (w.first_name || ' ' || w.last_name)::text as title,
            w.profession_uz::text as subtitle,
            'worker'::text as type,
            w.avatar_url::text as image_url,
            w.hourly_rate,
            w.profession_uz::text as category,
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

-- Fix search_workers function
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
    first_name text,
    last_name text,
    profession_uz text,
    experience_years integer,
    hourly_rate numeric,
    daily_rate numeric,
    rating numeric,
    review_count integer,
    location text,
    is_available boolean,
    skills text[],
    avatar_url text,
    phone_number text
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

-- Create secure functions for user data
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    name text,
    address text,
    city text,
    region text,
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

CREATE OR REPLACE FUNCTION add_user_address(
    user_id_param uuid,
    name_param text,
    address_param text,
    city_param text DEFAULT '',
    region_param text DEFAULT '',
    is_default_param boolean DEFAULT false
)
RETURNS TABLE (
    success boolean,
    message text,
    address_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    INSERT INTO addresses (user_id, name, address, city, region, is_default)
    VALUES (user_id_param, name_param, address_param, city_param, region_param, is_default_param)
    RETURNING id INTO new_address_id;
    
    RETURN QUERY SELECT true, 'Address added successfully'::text, new_address_id;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::text, NULL::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
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
        p.name_uz as product_name,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_all_content(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION search_workers(text, text, text, numeric, numeric, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon;
GRANT EXECUTE ON FUNCTION add_user_address(uuid, text, text, text, text, boolean) TO anon;
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon;
