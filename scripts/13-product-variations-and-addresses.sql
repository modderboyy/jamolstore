-- Remove Russian language columns
ALTER TABLE products DROP COLUMN IF EXISTS name_ru;
ALTER TABLE products DROP COLUMN IF EXISTS description_ru;

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own addresses" ON addresses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own addresses" ON addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own addresses" ON addresses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own addresses" ON addresses
  FOR DELETE USING (user_id = auth.uid());

-- Add address_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id);

-- Update orders table to make delivery_fee nullable
ALTER TABLE orders ALTER COLUMN delivery_fee DROP NOT NULL;

-- Add trigger to update product average_rating and review_count
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM product_reviews
      WHERE product_id = NEW.product_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = NEW.product_id
    )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Function to calculate available quantity
CREATE OR REPLACE FUNCTION calculate_available_quantity(product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  stock INTEGER;
  sold INTEGER;
BEGIN
  -- Get stock quantity
  SELECT stock_quantity INTO stock FROM products WHERE id = product_id;
  
  -- Calculate sold quantity from confirmed orders
  SELECT COALESCE(SUM(quantity), 0) INTO sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.product_id = product_id AND o.status IN ('confirmed', 'processing', 'shipped');
  
  -- Return available quantity
  RETURN GREATEST(0, stock - sold);
END;
$$ LANGUAGE plpgsql;
