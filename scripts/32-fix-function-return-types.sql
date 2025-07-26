-- Fix get_user_reviews function return type
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
CREATE OR REPLACE FUNCTION get_user_reviews(user_id uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
    rating integer,
    comment text,
    is_verified boolean,
    created_at timestamp with time zone
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
        r.comment,
        r.is_verified,
        r.created_at
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = get_user_reviews.user_id
    ORDER BY r.created_at DESC;
END;
$$;

-- Fix get_user_addresses function return type
DROP FUNCTION IF EXISTS get_user_addresses(uuid);
CREATE OR REPLACE FUNCTION get_user_addresses(user_id uuid)
RETURNS TABLE (
    id uuid,
    address_line text,
    city text,
    region text,
    postal_code text,
    is_default boolean,
    created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.address_line::text,
        a.city::text,
        a.region::text,
        a.postal_code::text,
        a.is_default,
        a.created_at
    FROM user_addresses a
    WHERE a.user_id = get_user_addresses.user_id
    ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix search function ambiguous column references
DROP FUNCTION IF EXISTS search_all_content(text);
CREATE OR REPLACE FUNCTION search_all_content(search_query text)
RETURNS TABLE (
    type text,
    id uuid,
    title text,
    description text,
    price numeric,
    image_url text,
    category text,
    relevance_score float
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'product'::text as type,
        p.id,
        p.name::text as title,
        p.description::text,
        p.price,
        p.image_url::text,
        p.category::text,
        (
            CASE 
                WHEN p.name ILIKE '%' || search_query || '%' THEN 3.0
                WHEN p.description ILIKE '%' || search_query || '%' THEN 2.0
                WHEN p.category ILIKE '%' || search_query || '%' THEN 1.0
                ELSE 0.5
            END
        )::float as relevance_score
    FROM products p
    WHERE p.is_active = true
    AND (
        p.name ILIKE '%' || search_query || '%' OR
        p.description ILIKE '%' || search_query || '%' OR
        p.category ILIKE '%' || search_query || '%'
    )
    ORDER BY relevance_score DESC, p.created_at DESC
    LIMIT 50;
END;
$$;
