-- Fix get_user_reviews function return type mismatch
DROP FUNCTION IF EXISTS get_user_reviews(uuid);

CREATE OR REPLACE FUNCTION get_user_reviews(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    product_name text,
    rating integer,
    comment text,
    created_at timestamp with time zone,
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
        r.comment,
        r.created_at,
        r.product_id,
        COALESCE(p.images[1], '/placeholder.svg')::text as product_image
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = user_id_param
    ORDER BY r.created_at DESC;
END;
$$;

-- Fix get_user_addresses function return type mismatch
DROP FUNCTION IF EXISTS get_user_addresses(uuid);

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
    FROM user_addresses a
    WHERE a.user_id = user_id_param
    ORDER BY a.is_default DESC, a.created_at DESC;
END;
$$;

-- Fix search_all_content function to avoid ambiguous column references
DROP FUNCTION IF EXISTS search_all_content(text, integer);

CREATE OR REPLACE FUNCTION search_all_content(search_term text, limit_count integer DEFAULT 20)
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
    -- Search products
    SELECT 
        p.id::text,
        p.name_uz::text as title,
        COALESCE(p.description_uz, '')::text as subtitle,
        'product'::text as type,
        COALESCE(p.images[1], '/placeholder.svg')::text as image_url,
        p.price::numeric,
        COALESCE(c.name_uz, 'Kategoriya yo''q')::text as category,
        (4.0 + random())::numeric as rating,
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
        CONCAT(w.first_name, ' ', w.last_name)::text as title,
        w.specialization::text as subtitle,
        'worker'::text as type,
        COALESCE(w.profile_image, '/placeholder-user.jpg')::text as image_url,
        w.hourly_rate::numeric as price,
        w.specialization::text as category,
        COALESCE(w.rating, 4.0)::numeric as rating,
        false as has_delivery
    FROM workers w
    WHERE w.is_available = true
    AND (
        w.first_name ILIKE '%' || search_term || '%' 
        OR w.last_name ILIKE '%' || search_term || '%'
        OR w.specialization ILIKE '%' || search_term || '%'
        OR w.bio ILIKE '%' || search_term || '%'
    )
    
    ORDER BY 
        CASE 
            WHEN title ILIKE search_term || '%' THEN 1
            WHEN title ILIKE '%' || search_term || '%' THEN 2
            ELSE 3
        END,
        rating DESC
    LIMIT limit_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_reviews(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_all_content(text, integer) TO anon, authenticated;
