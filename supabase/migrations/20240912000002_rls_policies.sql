-- Enable RLS on all tables
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_usage ENABLE ROW LEVEL SECURITY;

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
DECLARE
    role user_role;
BEGIN
    -- Check if user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RETURN NULL;
    END IF;
    
    -- Check if user is owner (first user or has owner role)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid 
        AND (raw_user_meta_data->>'role' = 'owner' OR created_at = (SELECT MIN(created_at) FROM auth.users))
    ) THEN
        RETURN 'owner';
    END IF;
    
    -- Check if user is admin
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid 
        AND raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RETURN 'admin';
    END IF;
    
    -- Check if user is staff
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_uuid 
        AND raw_user_meta_data->>'role' = 'staff'
    ) THEN
        RETURN 'staff';
    END IF;
    
    -- Default to customer
    RETURN 'customer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access customer data
CREATE OR REPLACE FUNCTION can_access_customer_data(target_customer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_role user_role;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    current_role := get_user_role(current_user_id);
    
    -- Owner and admin can access all customer data
    IF current_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Staff can access assigned customers (future implementation)
    IF current_role = 'staff' THEN
        -- For now, staff can access all customers
        -- TODO: Implement customer assignment system
        RETURN TRUE;
    END IF;
    
    -- Customers can only access their own data
    IF current_role = 'customer' THEN
        RETURN target_customer_id = current_user_id;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Financial Transactions RLS Policies
CREATE POLICY "Customers can view own transactions" ON financial_transactions
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage transactions" ON financial_transactions
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Invoices RLS Policies
CREATE POLICY "Customers can view own invoices" ON invoices
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage invoices" ON invoices
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Payments RLS Policies
CREATE POLICY "Customers can view own payments" ON payments
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage payments" ON payments
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Orders RLS Policies
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Customers can create orders" ON orders
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage orders" ON orders
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Order Items RLS Policies
CREATE POLICY "Customers can view own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE customer_id = auth.uid()
        ) OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage order items" ON order_items
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Vouchers RLS Policies
CREATE POLICY "Public can view active vouchers" ON vouchers
    FOR SELECT USING (
        is_active = true AND 
        (valid_until IS NULL OR valid_until >= CURRENT_DATE) AND
        deleted_at IS NULL
    );

CREATE POLICY "Staff can manage vouchers" ON vouchers
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Voucher Usage RLS Policies
CREATE POLICY "Customers can view own voucher usage" ON voucher_usage
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage voucher usage" ON voucher_usage
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Products RLS Policies
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (
        is_active = true AND 
        deleted_at IS NULL
    );

CREATE POLICY "Staff can manage products" ON products
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Product Categories RLS Policies
CREATE POLICY "Public can view active categories" ON product_categories
    FOR SELECT USING (
        is_active = true AND 
        deleted_at IS NULL
    );

CREATE POLICY "Staff can manage categories" ON product_categories
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Customers RLS Policies
CREATE POLICY "Customers can view own profile" ON customers
    FOR SELECT USING (
        id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Customers can update own profile" ON customers
    FOR UPDATE USING (
        id = auth.uid() OR 
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

CREATE POLICY "Staff can manage customers" ON customers
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner', 'staff')
    );

-- Tax Rates RLS Policies
CREATE POLICY "Public can view tax rates" ON tax_rates
    FOR SELECT USING (
        is_active = true
    );

CREATE POLICY "Staff can manage tax rates" ON tax_rates
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'owner')
    );

-- Create function to automatically create customer record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customers (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();