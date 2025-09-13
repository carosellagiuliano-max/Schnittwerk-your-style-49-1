-- Create product_categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create products table (replaces mock data)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    
    -- Product details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER, -- For services
    
    -- Product metadata
    image_url TEXT,
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_service BOOLEAN NOT NULL DEFAULT false,
    
    -- Swiss compliance
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 7.7,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create customers table (extends auth.users)
CREATE TABLE customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Customer details
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    date_of_birth DATE,
    
    -- Address
    street_address TEXT,
    zip_code VARCHAR(10),
    city VARCHAR(100),
    
    -- Preferences
    preferred_stylist UUID,
    notes TEXT,
    
    -- Stripe integration
    stripe_customer_id VARCHAR(255) UNIQUE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create tax_rates table (Swiss VAT configuration)
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0),
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    
    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create voucher_usage table (tracks voucher usage)
CREATE TABLE voucher_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Usage details
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_product_categories_name ON product_categories(name);
CREATE INDEX idx_product_categories_is_active ON product_categories(is_active);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_service ON products(is_service);

CREATE INDEX idx_customers_stripe_customer_id ON customers(stripe_customer_id);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE INDEX idx_tax_rates_code ON tax_rates(code);
CREATE INDEX idx_tax_rates_is_active ON tax_rates(is_active);

CREATE INDEX idx_voucher_usage_voucher_id ON voucher_usage(voucher_id);
CREATE INDEX idx_voucher_usage_customer_id ON voucher_usage(customer_id);
CREATE INDEX idx_voucher_usage_order_id ON voucher_usage(order_id);

-- Create updated_at triggers
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at BEFORE UPDATE ON tax_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tax rates for Switzerland
INSERT INTO tax_rates (name, rate, code, description) VALUES
    ('Standard VAT', 7.7, 'VAT_7_7', 'Standard Swiss VAT rate for services'),
    ('Reduced VAT', 2.5, 'VAT_2_5', 'Reduced Swiss VAT rate for essential goods'),
    ('Special VAT', 3.7, 'VAT_3_7', 'Special Swiss VAT rate for accommodation services');

-- Insert default product categories
INSERT INTO product_categories (name, description, sort_order) VALUES
    ('Haircuts', 'Professional hair cutting services', 1),
    ('Coloring', 'Hair coloring and dyeing services', 2),
    ('Treatments', 'Hair treatments and care services', 3),
    ('Styling', 'Hair styling and finishing services', 4),
    ('Products', 'Hair care products for sale', 5),
    ('Vouchers', 'Gift vouchers and packages', 6);