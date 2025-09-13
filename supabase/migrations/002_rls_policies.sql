-- Row Level Security (RLS) Policies
-- Implementing Swiss compliance and role-based access control

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Utility function to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role_enum AS $$
  SELECT role FROM profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Utility function to check if user is admin/owner
CREATE OR REPLACE FUNCTION is_admin_or_owner(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Utility function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    JOIN staff s ON s.profile_id = p.id
    WHERE p.id = user_uuid 
    AND s.is_active = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 1. PROFILES RLS POLICIES
-- Customers can only see their own profile
CREATE POLICY "customers_own_profile" ON profiles
  FOR ALL USING (
    id = auth.uid() 
    AND role = 'customer'
  );

-- Staff can see their own profile and customer profiles
CREATE POLICY "staff_profile_access" ON profiles
  FOR ALL USING (
    (id = auth.uid()) -- Own profile
    OR 
    (is_staff_member(auth.uid()) AND role = 'customer') -- Customer profiles for staff
  );

-- Admins and owners can see all profiles
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    is_admin_or_owner(auth.uid())
  );

-- 2. STAFF RLS POLICIES
-- Only admins/owners can manage staff
CREATE POLICY "admin_staff_management" ON staff
  FOR ALL USING (
    is_admin_or_owner(auth.uid())
  );

-- Staff can view other staff for scheduling purposes
CREATE POLICY "staff_view_colleagues" ON staff
  FOR SELECT USING (
    is_staff_member(auth.uid())
  );

-- 3. APPOINTMENTS RLS POLICIES
-- Customers can only see their own appointments
CREATE POLICY "customers_own_appointments" ON appointments
  FOR ALL USING (
    customer_id = auth.uid()
  );

-- Staff can see appointments they're assigned to
CREATE POLICY "staff_assigned_appointments" ON appointments
  FOR ALL USING (
    staff_id IN (
      SELECT s.id FROM staff s 
      WHERE s.profile_id = auth.uid() 
      AND s.is_active = TRUE
    )
  );

-- Staff can view all appointments for scheduling purposes
CREATE POLICY "staff_view_all_appointments" ON appointments
  FOR SELECT USING (
    is_staff_member(auth.uid())
  );

-- Admins can see all appointments
CREATE POLICY "admin_all_appointments" ON appointments
  FOR ALL USING (
    is_admin_or_owner(auth.uid())
  );

-- 4. ORDERS RLS POLICIES
-- Customers can only see their own orders
CREATE POLICY "customers_own_orders" ON orders
  FOR ALL USING (
    customer_id = auth.uid()
  );

-- Staff and admins can see all orders for fulfillment
CREATE POLICY "staff_admin_orders" ON orders
  FOR SELECT USING (
    is_staff_member(auth.uid()) OR is_admin_or_owner(auth.uid())
  );

-- Only admins can modify orders
CREATE POLICY "admin_modify_orders" ON orders
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

-- 5. ORDER ITEMS RLS POLICIES
-- Follow same pattern as orders
CREATE POLICY "customers_own_order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "staff_admin_order_items" ON order_items
  FOR SELECT USING (
    is_staff_member(auth.uid()) OR is_admin_or_owner(auth.uid())
  );

CREATE POLICY "admin_modify_order_items" ON order_items
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

-- 6. FINANCIAL TRANSACTIONS RLS POLICIES
-- Only admins and owners can access financial data
CREATE POLICY "admin_financial_access" ON financial_transactions
  FOR ALL USING (
    is_admin_or_owner(auth.uid())
  );

-- Staff can see their own commission transactions
CREATE POLICY "staff_own_commissions" ON financial_transactions
  FOR SELECT USING (
    staff_id IN (
      SELECT s.id FROM staff s 
      WHERE s.profile_id = auth.uid()
    )
    AND transaction_type = 'commission_payment'
  );

-- 7. WAITING LIST RLS POLICIES
-- Customers can only see their own waiting list entries
CREATE POLICY "customers_own_waiting_list" ON waiting_list
  FOR ALL USING (
    customer_id = auth.uid()
  );

-- Staff and admins can see all waiting list for management
CREATE POLICY "staff_admin_waiting_list" ON waiting_list
  FOR SELECT USING (
    is_staff_member(auth.uid()) OR is_admin_or_owner(auth.uid())
  );

-- Only admins can modify waiting list (staff should use separate functions)
CREATE POLICY "admin_modify_waiting_list" ON waiting_list
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

-- 8. GDPR CONSENTS RLS POLICIES
-- Users can only see their own consents
CREATE POLICY "users_own_gdpr_consents" ON gdpr_consents
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Admins can see all consents for compliance
CREATE POLICY "admin_gdpr_consents" ON gdpr_consents
  FOR SELECT USING (
    is_admin_or_owner(auth.uid())
  );

-- 9. AUDIT LOGS RLS POLICIES
-- Only admins and owners can access audit logs
CREATE POLICY "admin_audit_logs" ON audit_logs
  FOR SELECT USING (
    is_admin_or_owner(auth.uid())
  );

-- System can insert audit logs (using service role)
CREATE POLICY "system_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 10. PUBLIC ACCESS POLICIES (for non-sensitive data)
-- Products, categories, services are publicly readable
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT USING (is_active = TRUE);

-- Anyone can read active categories
CREATE POLICY "public_read_active_categories" ON categories
  FOR SELECT USING (is_active = TRUE);

-- Anyone can read active services
CREATE POLICY "public_read_active_services" ON services
  FOR SELECT USING (is_active = TRUE);

-- Only admins can modify products, categories, services
CREATE POLICY "admin_modify_products" ON products
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

CREATE POLICY "admin_modify_categories" ON categories
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

CREATE POLICY "admin_modify_services" ON services
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

-- 11. BUSINESS SETTINGS RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read business settings (opening hours, etc.)
CREATE POLICY "public_read_business_settings" ON business_settings
  FOR SELECT USING (true);

-- Only owners can modify business settings
CREATE POLICY "owner_modify_business_settings" ON business_settings
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- 12. STAFF SCHEDULES RLS
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;

-- Staff can see all schedules for coordination
CREATE POLICY "staff_view_schedules" ON staff_schedules
  FOR SELECT USING (
    is_staff_member(auth.uid()) OR is_admin_or_owner(auth.uid())
  );

-- Staff can only modify their own schedules
CREATE POLICY "staff_own_schedule" ON staff_schedules
  FOR INSERT, UPDATE, DELETE USING (
    staff_id IN (
      SELECT s.id FROM staff s 
      WHERE s.profile_id = auth.uid()
    )
  );

-- Admins can modify all schedules
CREATE POLICY "admin_all_schedules" ON staff_schedules
  FOR INSERT, UPDATE, DELETE USING (
    is_admin_or_owner(auth.uid())
  );

-- 13. ANALYTICS RLS
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Only admins and owners can access analytics
CREATE POLICY "admin_analytics_access" ON analytics_daily
  FOR ALL USING (
    is_admin_or_owner(auth.uid())
  );

-- Table to store allowed staff email domains
CREATE TABLE IF NOT EXISTS staff_email_domains (
  domain TEXT PRIMARY KEY
);

-- Insert initial staff domain
INSERT INTO staff_email_domains (domain) VALUES ('schnittwerk.ch') ON CONFLICT DO NOTHING;

-- Create a function to automatically grant appropriate role based on email domain
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);

  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM staff_email_domains d WHERE d.domain = email_domain
      ) THEN 'staff'::user_role_enum
      ELSE 'customer'::user_role_enum
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Swiss compliance: Data retention enforcement function
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS VOID AS $$
BEGIN
  -- Delete audit logs past retention period
  DELETE FROM audit_logs 
  WHERE retention_until < CURRENT_DATE;
  
  -- Anonymize customer data past retention period
  UPDATE profiles 
  SET 
    email = 'deleted-' || id::text || '@anonymized.local',
    phone = NULL,
    full_name = 'Deleted User',
    notes = NULL,
    gdpr_consent_date = NULL
  WHERE 
    data_retention_until < CURRENT_DATE
    AND role = 'customer';
    
  -- Log the retention enforcement
  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, new_values
  ) VALUES (
    NULL, 'delete', 'system', gen_random_uuid(), 
    '{"action": "data_retention_enforced", "date": "' || CURRENT_DATE || '"}'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule data retention enforcement (to be called daily via cron)
-- This would be set up in Supabase dashboard or via pg_cron extension