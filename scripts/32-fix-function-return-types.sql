-- Fix function return types to match expected text types
DROP FUNCTION IF EXISTS get_user_reviews(uuid);
CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
    rating integer,
    comment text,
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
        r.comment::text,
        r.created_at
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = user_id_param
    ORDER BY r.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS get_user_addresses(uuid);
CREATE OR REPLACE FUNCTION get_user_addresses(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    title text,
    address_line text,
    city text,
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
        a.title::text,
        a.address_line::text,
        a.city::text,
        a.is_default,
        a.created_at
    FROM user_addresses a
    WHERE a.user_id = user_id_param
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
    price decimal,
    image_url text,
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
        (
            CASE 
                WHEN p.name ILIKE '%' || search_query || '%' THEN 3.0
                WHEN p.description ILIKE '%' || search_query || '%' THEN 2.0
                WHEN c.name ILIKE '%' || search_query || '%' THEN 1.5
                ELSE 1.0
            END
        )::float as relevance_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        p.name ILIKE '%' || search_query || '%' OR
        p.description ILIKE '%' || search_query || '%' OR
        c.name ILIKE '%' || search_query || '%'
    ORDER BY relevance_score DESC, p.name ASC
    LIMIT 50;
END;
$$;
