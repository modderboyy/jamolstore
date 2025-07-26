-- Fix get_search_suggestions function
DROP FUNCTION IF EXISTS get_search_suggestions(text, integer);

CREATE OR REPLACE FUNCTION get_search_suggestions(
    search_term text DEFAULT '',
    limit_count integer DEFAULT 10
)
RETURNS TABLE (
    suggestion text,
    type text,
    count bigint
)
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
        LIMIT limit_count / 2
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
        LIMIT limit_count / 2
    )
    ORDER BY count DESC, suggestion
    LIMIT limit_count;
END;
$$;

-- Create product view increment function with bot protection
CREATE OR REPLACE FUNCTION increment_product_view(
    product_id_param uuid,
    user_agent_param text DEFAULT '',
    ip_address_param text DEFAULT ''
)
RETURNS TABLE (
    success boolean,
    message text,
    new_view_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_views integer;
    is_bot boolean := false;
BEGIN
    -- Simple bot detection
    IF user_agent_param ILIKE '%bot%' OR 
       user_agent_param ILIKE '%crawler%' OR 
       user_agent_param ILIKE '%spider%' OR
       user_agent_param = '' THEN
        is_bot := true;
    END IF;
    
    -- Don't increment for bots
    IF is_bot THEN
        SELECT view_count INTO current_views FROM products WHERE id = product_id_param;
        RETURN QUERY SELECT true, 'Bot detected, view not counted'::text, COALESCE(current_views, 0);
        RETURN;
    END IF;
    
    -- Increment view count
    UPDATE products 
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = product_id_param
    RETURNING view_count INTO current_views;
    
    IF FOUND THEN
        RETURN QUERY SELECT true, 'View count incremented'::text, current_views;
    ELSE
        RETURN QUERY SELECT false, 'Product not found'::text, 0;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::text, 0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_search_suggestions(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION increment_product_view(uuid, text, text) TO anon;
