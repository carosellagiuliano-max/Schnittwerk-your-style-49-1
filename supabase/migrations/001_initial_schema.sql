-- Hair Salon Database Schema
-- Based on PLAN.md comprehensive transformation roadmap

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom enums for type safety
CREATE TYPE user_role_enum AS ENUM ('owner', 'admin', 'staff', 'customer');
CREATE TYPE gender_enum AS ENUM ('female', 'male', 'child', 'other');
CREATE TYPE loyalty_enum AS ENUM ('neu', 'bronze', 'silber', 'gold', 'diamant');
CREATE TYPE appointment_status_enum AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 
  'cancelled_by_customer', 'cancelled_by_salon', 'no_show'
);
CREATE TYPE staff_position_enum AS ENUM ('owner', 'senior_stylist', 'stylist', 'assistant', 'trainee');
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_enum AS ENUM (
  'cash', 'card', 'twint', 'bank_transfer', 'voucher', 'online'
);
CREATE TYPE transaction_type_enum AS ENUM (
  'appointment_payment', 'product_sale', 'refund', 'discount', 
  'commission_payment', 'expense', 'adjustment'
);
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE consent_type_enum AS ENUM ('gdpr', 'marketing', 'analytics', 'data_processing');
CREATE TYPE consent_method_enum AS ENUM ('website_form', 'email_confirmation', 'phone_verbal', 'in_person');
CREATE TYPE audit_action_enum AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout');

-- 1. User & Profile Management
-- profiles: Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role_enum NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  gender gender_enum,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Swiss Compliance
  gdpr_consent_date TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT FALSE,
  data_retention_until DATE,
  
  -- Customer-specific fields
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_status loyalty_enum DEFAULT 'neu',
  last_visit DATE,
  preferred_staff_id UUID, -- Will reference staff(id) after staff table is created
  notes TEXT
);

-- 2. Staff Management
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) UNIQUE,
  
  -- Basic Info
  employee_id TEXT UNIQUE NOT NULL,
  position staff_position_enum NOT NULL,
  specialties TEXT[], -- ['schnitt', 'farbe', 'bart']
  
  -- Scheduling
  weekly_hours INTEGER DEFAULT 40,
  hourly_rate DECIMAL(8,2),
  commission_rate DECIMAL(5,2), -- Percentage
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  hire_date DATE NOT NULL,
  termination_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for preferred_staff_id after staff table exists
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_preferred_staff 
  FOREIGN KEY (preferred_staff_id) REFERENCES staff(id);

-- Staff schedules
CREATE TABLE staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  
  -- Schedule Definition
  effective_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  
  -- Schedule Types
  is_regular BOOLEAN DEFAULT TRUE, -- vs. one-time override
  is_available BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT valid_schedule_times CHECK (end_time > start_time)
);

-- 3. Product & E-commerce System
-- Categories for products
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id), -- For subcategories
  
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) NOT NULL,
  
  -- Product Info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  usage_instructions TEXT,
  
  -- Pricing & Business
  price DECIMAL(8,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  cost_price DECIMAL(8,2), -- For margin calculation
  
  -- Inventory
  sku TEXT UNIQUE,
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Media & Display
  image_url TEXT,
  image_alt TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Swiss Compliance
  vat_rate DECIMAL(5,2) DEFAULT 7.70 -- Swiss VAT
);

-- 4. Services Management
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service Info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Service Configuration
  requires_gender gender_enum, -- Some services are gender-specific
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Appointment System
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  staff_id UUID REFERENCES staff(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  
  -- Scheduling
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Business Logic
  status appointment_status_enum DEFAULT 'pending',
  price DECIMAL(8,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT, -- Staff-only notes
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time),
  CONSTRAINT future_appointment CHECK (appointment_date >= CURRENT_DATE)
);

-- Waiting list for appointments
CREATE TABLE waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  preferred_staff_id UUID REFERENCES staff(id),
  
  -- Preferences
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  flexible_dates BOOLEAN DEFAULT FALSE,
  flexible_times BOOLEAN DEFAULT FALSE,
  
  -- Priority System
  priority priority_enum DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  max_wait_days INTEGER DEFAULT 30,
  
  -- Auto-notification settings
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  last_notified_at TIMESTAMPTZ
);

-- 6. Order & E-commerce System
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Order Details
  order_number TEXT UNIQUE NOT NULL, -- Human-readable order number
  status order_status_enum DEFAULT 'pending',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Payment
  payment_method TEXT,
  payment_status payment_status_enum DEFAULT 'pending',
  payment_intent_id TEXT, -- Stripe payment intent
  
  -- Fulfillment
  is_gift_wrapped BOOLEAN DEFAULT FALSE,
  gift_wrap_gender gender_enum,
  special_instructions TEXT,
  
  -- Timestamps
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  payment_completed_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  
  -- Item Details
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(8,2) NOT NULL,
  
  -- Snapshot of product info at time of order
  product_name TEXT NOT NULL,
  product_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Financial System
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction Details
  transaction_type transaction_type_enum NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- References
  customer_id UUID REFERENCES profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  order_id UUID REFERENCES orders(id),
  staff_id UUID REFERENCES staff(id), -- For commission tracking
  
  -- Payment Details
  payment_method payment_method_enum,
  payment_reference TEXT, -- External payment ID
  
  -- Swiss Tax Compliance
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  
  -- Metadata
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Accounting
  accounting_period TEXT, -- YYYY-MM for reporting
  is_reconciled BOOLEAN DEFAULT FALSE
);

-- Pre-computed daily analytics for performance
CREATE TABLE analytics_daily (
  date DATE PRIMARY KEY,
  
  -- Appointments
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  no_show_appointments INTEGER DEFAULT 0,
  
  -- Revenue
  total_revenue DECIMAL(10,2) DEFAULT 0,
  appointment_revenue DECIMAL(10,2) DEFAULT 0,
  product_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Customers
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Waiting List Performance
  waiting_list_conversions INTEGER DEFAULT 0,
  
  -- Computed metrics
  average_appointment_value DECIMAL(8,2),
  utilization_rate DECIMAL(5,2), -- % of available slots booked
  
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Compliance & Security
-- GDPR consents tracking
CREATE TABLE gdpr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Consent Details
  consent_type consent_type_enum NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMPTZ NOT NULL,
  consent_withdrawn_date TIMESTAMPTZ,
  
  -- Legal Documentation
  privacy_policy_version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_method consent_method_enum NOT NULL,
  
  -- Data Processing Purposes
  purposes TEXT[] NOT NULL, -- ['marketing', 'analytics', 'service_delivery']
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor Information
  user_id UUID REFERENCES profiles(id),
  user_role user_role_enum,
  
  -- Action Details
  action audit_action_enum NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  
  -- Change Tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Compliance
  retention_until DATE, -- Auto-deletion date
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Business Settings
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Info
  salon_name TEXT NOT NULL DEFAULT 'Schnittwerk Hair Salon',
  address TEXT,
  phone TEXT,
  email TEXT,
  
  -- Operating Hours (JSON format for flexibility)
  opening_hours JSONB,
  
  -- Swiss Business Configuration
  vat_rate DECIMAL(5,2) DEFAULT 7.70,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Settings metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default business settings
INSERT INTO business_settings (salon_name, opening_hours) VALUES 
('Schnittwerk Hair Salon', '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"18:00","closed":false},"saturday":{"open":"09:00","close":"16:00","closed":false},"sunday":{"closed":true}}');

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_customer ON financial_transactions(customer_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Add update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();