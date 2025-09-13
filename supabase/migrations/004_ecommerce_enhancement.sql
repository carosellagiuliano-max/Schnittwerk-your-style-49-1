-- Sprint C Week 9: E-commerce Database Schema Enhancement
-- Persistent shopping cart and comprehensive order management
-- Swiss VAT compliance and inventory tracking

-- =====================================
-- Persistent Shopping Cart Tables
-- =====================================

-- Persistent carts for logged in users and guest sessions
CREATE TABLE persistent_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest users
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  vat_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  currency CHAR(3) DEFAULT 'CHF',
  is_gift_wrapped BOOLEAN DEFAULT FALSE,
  gift_wrap_gender TEXT CHECK (gift_wrap_gender IN ('men', 'women')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  
  -- Ensure one cart per customer or session
  CONSTRAINT unique_customer_cart UNIQUE(customer_id),
  CONSTRAINT unique_session_cart UNIQUE(session_id),
  CONSTRAINT customer_or_session CHECK (
    (customer_id IS NOT NULL AND session_id IS NULL) OR 
    (customer_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Cart items with product details cached for consistency
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES persistent_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL, -- Cached for consistency
  product_price DECIMAL(10,2) NOT NULL, -- Price at time of adding
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  category TEXT NOT NULL,
  image_url TEXT,
  is_gift_wrapped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate products in same cart
  CONSTRAINT unique_cart_product UNIQUE(cart_id, product_id)
);

-- =====================================
-- Enhanced Order Management
-- =====================================

-- Order fulfillment status enum
CREATE TYPE fulfillment_status_enum AS ENUM (
  'pending',
  'prepared', 
  'ready_for_pickup',
  'shipped',
  'delivered'
);

-- Add new columns to existing orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS fulfillment_status fulfillment_status_enum DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_gift_wrapped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_wrap_gender TEXT CHECK (gift_wrap_gender IN ('men', 'women')),
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Generate order numbers if not exists
UPDATE orders SET order_number = 'ORD-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || SUBSTRING(id::TEXT, 1, 4) 
WHERE order_number IS NULL;

-- Make order_number required going forward
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- Order items with cached product details and fulfillment tracking
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  category TEXT NOT NULL,
  image_url TEXT,
  fulfillment_status fulfillment_status_enum DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order fulfillment tracking
CREATE TABLE order_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status fulfillment_status_enum NOT NULL,
  prepared_by UUID REFERENCES profiles(id), -- Staff member who prepared
  prepared_at TIMESTAMPTZ,
  tracking_number TEXT,
  shipping_method TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping and billing addresses
CREATE TABLE order_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('shipping', 'billing')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country CHAR(2) DEFAULT 'CH', -- ISO country code
  canton TEXT, -- Swiss canton
  vat_number TEXT, -- For business billing addresses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_order_address_type UNIQUE(order_id, address_type)
);

-- =====================================
-- Product Inventory Management
-- =====================================

-- Comprehensive inventory tracking
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
  low_stock_threshold INTEGER DEFAULT 5,
  is_backorder_allowed BOOLEAN DEFAULT FALSE,
  supplier_info TEXT,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
  CONSTRAINT positive_reserved CHECK (reserved_quantity >= 0),
  CONSTRAINT valid_reserved CHECK (reserved_quantity <= stock_quantity)
);

-- Inventory movement history
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('restock', 'sale', 'reservation', 'release', 'adjustment', 'damage')),
  quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
  reference_id UUID, -- Order ID, adjustment ID, etc.
  reference_type TEXT, -- 'order', 'adjustment', 'restock', etc.
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- Swiss Business Compliance
-- =====================================

-- Swiss VAT rates table for future flexibility
CREATE TABLE swiss_vat_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_name TEXT NOT NULL, -- 'standard', 'reduced', 'special'
  rate_percentage DECIMAL(5,3) NOT NULL, -- e.g., 7.700 for 7.7%
  description TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_rate CHECK (rate_percentage >= 0),
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Insert current Swiss VAT rates
INSERT INTO swiss_vat_rates (rate_name, rate_percentage, description, effective_from) VALUES
('standard', 7.700, 'Standard VAT rate for most goods and services', '2024-01-01'),
('reduced', 2.500, 'Reduced VAT rate for specific goods (books, food, etc.)', '2024-01-01'),
('special', 3.700, 'Special VAT rate for accommodation', '2024-01-01');

-- =====================================
-- Inventory Management Functions
-- =====================================

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Check if enough inventory is available
  IF (SELECT available_quantity FROM inventory WHERE product_id = p_product_id) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', 
      (SELECT available_quantity FROM inventory WHERE product_id = p_product_id), 
      p_quantity;
  END IF;
  
  -- Reserve the inventory
  UPDATE inventory 
  SET reserved_quantity = reserved_quantity + p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Log the movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity_change, reference_type, notes)
  VALUES (p_product_id, 'reservation', -p_quantity, 'cart', 'Reserved for cart');
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved inventory
CREATE OR REPLACE FUNCTION release_reserved_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Release the inventory
  UPDATE inventory 
  SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity),
      updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Log the movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity_change, reference_type, notes)
  VALUES (p_product_id, 'release', p_quantity, 'cart', 'Released from cart');
END;
$$ LANGUAGE plpgsql;

-- Function to commit reserved inventory (convert to sale)
CREATE OR REPLACE FUNCTION commit_reserved_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Convert reserved to sold
  UPDATE inventory 
  SET stock_quantity = stock_quantity - p_quantity,
      reserved_quantity = GREATEST(0, reserved_quantity - p_quantity),
      updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Log the movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity_change, reference_type, notes)
  VALUES (p_product_id, 'sale', -p_quantity, 'order', 'Sold via order');
END;
$$ LANGUAGE plpgsql;

-- Function to restock inventory
CREATE OR REPLACE FUNCTION restock_inventory(p_product_id UUID, p_quantity INTEGER, p_notes TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Add to stock
  UPDATE inventory 
  SET stock_quantity = stock_quantity + p_quantity,
      last_restocked_at = NOW(),
      updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Log the movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity_change, reference_type, notes)
  VALUES (p_product_id, 'restock', p_quantity, 'manual', COALESCE(p_notes, 'Manual restock'));
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Triggers and Indexes
-- =====================================

-- Update timestamps
CREATE TRIGGER update_persistent_carts_updated_at 
  BEFORE UPDATE ON persistent_carts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
  BEFORE UPDATE ON order_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_fulfillments_updated_at 
  BEFORE UPDATE ON order_fulfillments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON inventory 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_persistent_carts_customer ON persistent_carts(customer_id);
CREATE INDEX idx_persistent_carts_session ON persistent_carts(session_id);
CREATE INDEX idx_persistent_carts_expires ON persistent_carts(expires_at);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_fulfillments_order ON order_fulfillments(order_id);
CREATE INDEX idx_order_fulfillments_status ON order_fulfillments(status);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_low_stock ON inventory(available_quantity, low_stock_threshold);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_order_addresses_order ON order_addresses(order_id);

-- =====================================
-- Cart Cleanup Automation
-- =====================================

-- Function to clean up expired carts
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Release all inventory from expired carts
  WITH expired_carts AS (
    SELECT id FROM persistent_carts WHERE expires_at < NOW()
  ),
  expired_items AS (
    SELECT ci.product_id, ci.quantity
    FROM cart_items ci
    JOIN expired_carts ec ON ci.cart_id = ec.id
  )
  SELECT COUNT(*) INTO deleted_count FROM expired_items;
  
  -- Release reserved inventory for expired items
  UPDATE inventory 
  SET reserved_quantity = GREATEST(0, reserved_quantity - (
    SELECT COALESCE(SUM(ci.quantity), 0)
    FROM cart_items ci
    JOIN persistent_carts pc ON ci.cart_id = pc.id
    WHERE pc.expires_at < NOW() AND ci.product_id = inventory.product_id
  ))
  WHERE product_id IN (
    SELECT DISTINCT ci.product_id
    FROM cart_items ci
    JOIN persistent_carts pc ON ci.cart_id = pc.id
    WHERE pc.expires_at < NOW()
  );
  
  -- Delete expired carts (cascades to cart_items)
  DELETE FROM persistent_carts WHERE expires_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Initial Inventory Setup
-- =====================================

-- Create inventory records for existing products
INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold)
SELECT 
  id,
  COALESCE(sku, 'SKU-' || SUBSTRING(id::TEXT, 1, 8)),
  CASE 
    WHEN stock_quantity IS NOT NULL THEN stock_quantity
    ELSE 50 -- Default stock for new products
  END,
  5 -- Default low stock threshold
FROM products
WHERE id NOT IN (SELECT product_id FROM inventory);

-- =====================================
-- Swiss Compliance Views
-- =====================================

-- View for VAT reporting
CREATE VIEW swiss_vat_report AS
SELECT 
  DATE_TRUNC('month', o.created_at) as report_month,
  COUNT(*) as total_orders,
  SUM(o.subtotal) as total_subtotal,
  SUM(o.tax_amount) as total_vat,
  SUM(o.total_amount) as total_amount,
  o.currency
FROM orders o
WHERE o.status NOT IN ('cancelled', 'refunded')
  AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY DATE_TRUNC('month', o.created_at), o.currency
ORDER BY report_month DESC;

-- View for low stock alerts
CREATE VIEW low_stock_alerts AS
SELECT 
  p.name as product_name,
  p.sku,
  i.stock_quantity,
  i.reserved_quantity,
  i.available_quantity,
  i.low_stock_threshold,
  (i.available_quantity::FLOAT / NULLIF(i.low_stock_threshold, 0)) as stock_ratio
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.available_quantity <= i.low_stock_threshold
  AND p.is_active = true
ORDER BY stock_ratio ASC, i.available_quantity ASC;

-- View for order fulfillment dashboard
CREATE VIEW order_fulfillment_dashboard AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.fulfillment_status,
  o.total_amount,
  o.created_at,
  o.shipped_at,
  o.delivered_at,
  p.full_name as customer_name,
  p.email as customer_email,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN profiles p ON o.customer_id = p.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled')
GROUP BY o.id, o.order_number, o.status, o.fulfillment_status, o.total_amount, 
         o.created_at, o.shipped_at, o.delivered_at, p.full_name, p.email
ORDER BY 
  CASE o.fulfillment_status
    WHEN 'pending' THEN 1
    WHEN 'prepared' THEN 2
    WHEN 'ready_for_pickup' THEN 3
    WHEN 'shipped' THEN 4
    WHEN 'delivered' THEN 5
  END,
  o.created_at DESC;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;