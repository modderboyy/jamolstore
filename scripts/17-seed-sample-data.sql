-- Kompaniya ma'lumotlarini to'ldirish
INSERT INTO company (name, version, logo_url, phone_number, location, time, social_telegram, social_instagram, is_active) VALUES
('JamolStroy', '1.0.0', '/placeholder-logo.png', '+998 90 123 45 67', 'Toshkent sh., Chilonzor t.', 'Dush-Shan: 9:00-18:00', '@jamolstroy_uz', '@jamolstroy_uz', true)
ON CONFLICT (version) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    phone_number = EXCLUDED.phone_number,
    location = EXCLUDED.location,
    time = EXCLUDED.time,
    social_telegram = EXCLUDED.social_telegram,
    social_instagram = EXCLUDED.social_instagram,
    updated_at = NOW();

-- Asosiy kategoriyalarni to'ldirish
INSERT INTO categories (name_uz, name_ru, icon_name, sort_order, is_main) VALUES
('Armatura', 'Арматура', 'construction', 1, true),
('Trubalar', 'Трубы', 'pipe', 2, true),
('Profil', 'Профиль', 'square', 3, true),
('Plastik', 'Пластик', 'layers', 4, true),
('Asboblar', 'Инструменты', 'wrench', 5, true),
('Elektr', 'Электро', 'zap', 6, true)
ON CONFLICT DO NOTHING;

-- Armatura subkategoriyalari
INSERT INTO categories (name_uz, name_ru, parent_id, icon_name, sort_order) 
SELECT 'Armatura 12mm', 'Арматура 12мм', id, 'minus', 1 FROM categories WHERE name_uz = 'Armatura'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name_uz, name_ru, parent_id, icon_name, sort_order) 
SELECT 'Armatura 14mm', 'Арматура 14мм', id, 'minus', 2 FROM categories WHERE name_uz = 'Armatura'
ON CONFLICT DO NOTHING;

INSERT INTO categories (name_uz, name_ru, parent_id, icon_name, sort_order) 
SELECT 'Armatura 16mm', 'Арматура 16мм', id, 'minus', 3 FROM categories WHERE name_uz = 'Armatura'
ON CONFLICT DO NOTHING;

-- Namunaviy mahsulotlar
INSERT INTO products (name_uz, name_ru, description_uz, description_ru, category_id, price, unit, stock_quantity, delivery_limit, delivery_price, has_delivery, images, is_popular, is_featured, specifications) 
SELECT 
    'Armatura 12mm', 
    'Арматура 12мм',
    'Yuqori sifatli armatura, qurilish ishlari uchun',
    'Высококачественная арматура для строительных работ',
    id,
    8500.00,
    'metr',
    1000,
    100000.00,
    15000.00,
    true,
    ARRAY['/placeholder.svg?height=400&width=400&text=Armatura+12mm'],
    true,
    true,
    '{"rang": [{"name": "Qora", "value": "black"}, {"name": "Kulrang", "value": "gray"}], "uzunlik": [{"name": "6m", "value": "6m"}, {"name": "12m", "value": "12m", "price": 5000}]}'::jsonb
FROM categories WHERE name_uz = 'Armatura 12mm'
ON CONFLICT DO NOTHING;

INSERT INTO products (name_uz, name_ru, description_uz, description_ru, category_id, price, unit, stock_quantity, delivery_limit, delivery_price, has_delivery, images, is_popular, is_featured, specifications) 
SELECT 
    'Armatura 14mm', 
    'Арматура 14мм',
    'Mustahkam armatura, katta qurilish loyihalari uchun',
    'Прочная арматура для крупных строительных проектов',
    id,
    11200.00,
    'metr',
    800,
    150000.00,
    20000.00,
    true,
    ARRAY['/placeholder.svg?height=400&width=400&text=Armatura+14mm'],
    true,
    false,
    '{"rang": [{"name": "Qora", "value": "black"}, {"name": "Kulrang", "value": "gray"}], "uzunlik": [{"name": "6m", "value": "6m"}, {"name": "12m", "value": "12m", "price": 7000}]}'::jsonb
FROM categories WHERE name_uz = 'Armatura 14mm'
ON CONFLICT DO NOTHING;

-- Ko'proq mahsulotlar qo'shish
INSERT INTO products (name_uz, name_ru, description_uz, category_id, price, unit, stock_quantity, delivery_limit, delivery_price, has_delivery, images, is_popular, specifications) 
SELECT 
    'Armatura 16mm', 
    'Арматура 16мм',
    'Og''ir qurilish ishlari uchun armatura',
    id,
    14500.00,
    'metr',
    600,
    200000.00,
    25000.00,
    true,
    ARRAY['/placeholder.svg?height=400&width=400&text=Armatura+16mm'],
    true,
    '{"rang": [{"name": "Qora", "value": "black"}, {"name": "Kulrang", "value": "gray"}], "uzunlik": [{"name": "6m", "value": "6m"}, {"name": "12m", "value": "12m", "price": 10000}]}'::jsonb
FROM categories WHERE name_uz = 'Armatura 16mm'
ON CONFLICT DO NOTHING;

-- Asboblar kategoriyasi uchun mahsulotlar
INSERT INTO products (name_uz, name_ru, description_uz, category_id, price, unit, stock_quantity, delivery_limit, delivery_price, has_delivery, images, is_featured, specifications) 
SELECT 
    'Perforator Bosch', 
    'Перфоратор Bosch',
    'Professional perforator, qurilish ishlari uchun',
    id,
    850000.00,
    'dona',
    25,
    500000.00,
    30000.00,
    false,
    ARRAY['/placeholder.svg?height=400&width=400&text=Perforator+Bosch'],
    true,
    '{"quvvat": [{"name": "800W", "value": "800w"}, {"name": "1200W", "value": "1200w", "price": 150000}], "rang": [{"name": "Ko''k", "value": "blue"}, {"name": "Qizil", "value": "red"}]}'::jsonb
FROM categories WHERE name_uz = 'Asboblar'
ON CONFLICT DO NOTHING;

-- Rental mahsulotlar qo'shish
INSERT INTO products (name_uz, name_ru, description_uz, description_ru, category_id, price, unit, product_type, rental_time_unit, rental_price_per_unit, rental_deposit, rental_min_duration, rental_max_duration, stock_quantity, min_order_quantity, has_delivery, is_available, is_featured, specifications) 
SELECT 
    'Perforator ijarasi', 
    'Аренда перфоратора', 
    'Professional perforator soatlik ijara uchun', 
    'Профессиональный перфоратор для почасовой аренды',
    id,
    0,
    'dona', 
    'rental', 
    'hour',
    15000, 
    50000, 
    1, 
    24,
    5, 
    1, 
    true, 
    true, 
    true,
    '{"quvvat": [{"name": "800W", "value": "800w"}, {"name": "1200W", "value": "1200w", "price": 5000}]}'::jsonb
FROM categories WHERE name_uz = 'Asboblar'
ON CONFLICT DO NOTHING;

-- Reklama bannerlarini qo'shish
INSERT INTO ads (name, image_url, link, is_active, sort_order) VALUES
('Yangi armatura keldi!', '/placeholder.svg?height=200&width=800&text=Yangi+Armatura', '/catalog?category=armatura', true, 1),
('Chegirmalar', '/placeholder.svg?height=200&width=800&text=Chegirmalar', '/catalog?discount=true', true, 2)
ON CONFLICT DO NOTHING;

-- Test foydalanuvchi
INSERT INTO users (telegram_id, phone_number, first_name, last_name, is_verified) VALUES
(123456789, '+998901234567', 'Test', 'Foydalanuvchi', true)
ON CONFLICT DO NOTHING;
