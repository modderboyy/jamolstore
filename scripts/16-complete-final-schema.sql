-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS rental_orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS worker_orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS company CASCADE;
DROP TABLE IF EXISTS website_login_sessions CASCADE;
DROP TABLE IF EXISTS login_sessions CASCADE;
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    username VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    temp_token VARCHAR(255),
    temp_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram foydalanuvchilari jadvali (webhook uchun)
CREATE TABLE IF NOT EXISTS telegram_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    username VARCHAR(100),
    is_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login sessiyalari jadvali
CREATE TABLE IF NOT EXISTS login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    telegram_id BIGINT NOT NULL,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    client_id VARCHAR(100) DEFAULT 'jamolstroy_web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Website login sessions jadvali
CREATE TABLE IF NOT EXISTS website_login_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    temp_token TEXT NOT NULL,
    client_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Kategoriyalar jadvali
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    icon_name VARCHAR(100),
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_main BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 0,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mahsulotlar jadvali
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_uz VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    description_uz TEXT,
    description_ru TEXT,
    category_id UUID REFERENCES categories(id) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    product_type VARCHAR(20) DEFAULT 'sale' CHECK (product_type IN ('sale', 'rental')),
    rental_time_unit VARCHAR(20) CHECK (rental_time_unit IN ('hour', 'day', 'week', 'month')),
    rental_price_per_unit DECIMAL(10,2),
    rental_deposit DECIMAL(10,2) DEFAULT 0,
    rental_min_duration INTEGER DEFAULT 1,
    rental_max_duration INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    min_order_quantity INTEGER DEFAULT 1,
    images TEXT[],
    specifications JSONB,
    delivery_limit DECIMAL(12,2) DEFAULT 0,
    delivery_price DECIMAL(12,2) DEFAULT 0,
    has_delivery BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ishchilar profili jadvali
CREATE TABLE IF NOT EXISTS worker_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    profession_uz VARCHAR(255) NOT NULL,
    profession_ru VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    skills TEXT[],
    portfolio_images TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    location_uz VARCHAR(255),
    location_ru VARCHAR(255),
    description_uz TEXT,
    work_schedule JSONB DEFAULT '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "09:00", "end": "15:00"}, "sunday": {"off": true}}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Manzillar jadvali
CREATE TABLE IF NOT EXISTS addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(255),
    region VARCHAR(255),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buyurtmalar jadvali
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    address_id UUID REFERENCES addresses(id),
    delivery_with_service BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL,
    delivery_fee DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    telegram_message_id INTEGER,
    estimated_delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buyurtma elementlari jadvali
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    variations JSONB,
    rental_duration INTEGER,
    rental_time_unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ishchi buyurtmalari jadvali
CREATE TABLE IF NOT EXISTS worker_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) NOT NULL,
    worker_id UUID REFERENCES users(id) NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    estimated_hours INTEGER,
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    work_address TEXT NOT NULL,
    work_phone VARCHAR(20) NOT NULL,
    scheduled_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sharhlar jadvali (umumiy)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID REFERENCES users(id) NOT NULL,
    reviewee_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    order_id UUID REFERENCES orders(id),
    worker_order_id UUID REFERENCES worker_orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mahsulot sharhlari jadvali
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, customer_id, order_id)
);

-- Savatcha jadvali
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    variations JSONB,
    rental_duration INTEGER,
    rental_time_unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Reklama bannerlari jadvali
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kompaniya ma'lumotlari jadvali
CREATE TABLE IF NOT EXISTS company (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL UNIQUE,
    logo_url TEXT,
    phone_number TEXT,
    location TEXT,
    time TEXT,
    social_telegram TEXT,
    social_x TEXT,
    social_youtube TEXT,
    social_instagram TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_sessions_telegram_id ON login_sessions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_temp_token ON website_login_sessions(temp_token);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_client_id ON website_login_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_user_id ON website_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_status ON website_login_sessions(status);
CREATE INDEX IF NOT EXISTS idx_website_login_sessions_expires_at ON website_login_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_rental_time_unit ON products(rental_time_unit);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_worker_orders_customer ON worker_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_worker_orders_worker ON worker_orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON product_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_company_version ON company(version);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_main ON categories(is_main);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple', name_uz || ' ' || COALESCE(description_uz, '')));

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_temp_token_client_id ON website_login_sessions(temp_token, client_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_approved_session ON website_login_sessions(user_id) WHERE status = 'approved' AND expires_at > NOW();

-- Trigger funksiyasi updated_at ni yangilash uchun
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Category path update function
CREATE OR REPLACE FUNCTION update_category_path_and_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate level and path
  IF NEW.parent_id IS NULL THEN
    NEW.level = 0;
    NEW.path = NEW.id::text;
  ELSE
    SELECT level + 1, path || '.' || NEW.id::text
    INTO NEW.level, NEW.path
    FROM categories 
    WHERE id = NEW.parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_login_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM website_login_sessions 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Triggerlar
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_telegram_users_updated_at ON telegram_users;
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON telegram_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS category_path_trigger ON categories;
CREATE TRIGGER category_path_trigger BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_category_path_and_level();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_worker_profiles_updated_at ON worker_profiles;
CREATE TRIGGER update_worker_profiles_updated_at BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_worker_orders_updated_at ON worker_orders;
CREATE TRIGGER update_worker_orders_updated_at BEFORE UPDATE ON worker_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_updated_at ON company;
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON company FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_login_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Products policies (public read)
CREATE POLICY IF NOT EXISTS "Products are viewable by everyone" ON products
    FOR SELECT USING (is_available = true);

-- Orders policies
CREATE POLICY IF NOT EXISTS "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid()::text = customer_id::text);

CREATE POLICY IF NOT EXISTS "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);

-- Cart policies
CREATE POLICY IF NOT EXISTS "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Addresses policies
CREATE POLICY IF NOT EXISTS "Users can manage own addresses" ON addresses
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Product reviews policies
CREATE POLICY IF NOT EXISTS "Anyone can view reviews" ON product_reviews
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own reviews" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);

-- Website login sessions policies
CREATE POLICY IF NOT EXISTS "Allow all operations for service role" ON website_login_sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Allow read for authenticated users" ON website_login_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
