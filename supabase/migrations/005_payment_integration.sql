-- Sprint C Week 10: Payment Integration Database Schema
-- Stripe integration with Swiss payment methods and compliance

-- =====================================
-- Payment Processing Tables
-- =====================================

-- Payment intents from Stripe
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id),
  
  -- Payment Details
  amount INTEGER NOT NULL, -- Amount in Rappen (CHF cents)
  currency CHAR(3) DEFAULT 'CHF',
  status TEXT NOT NULL CHECK (status IN (
    'requires_payment_method',
    'requires_confirmation', 
    'requires_action',
    'processing',
    'requires_capture',
    'canceled',
    'succeeded',
    'failed'
  )),
  
  -- Payment Methods
  payment_method_types TEXT[] DEFAULT ARRAY['card'],
  payment_method_id TEXT,
  payment_method_details JSONB,
  
  -- Swiss Compliance
  vat_amount INTEGER, -- VAT amount in Rappen
  processing_fee INTEGER DEFAULT 0, -- Processing fee in Rappen
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  description TEXT,
  receipt_email TEXT,
  
  -- Timestamps
  stripe_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_currency CHECK (currency = 'CHF')
);

-- Payment method configurations for Swiss market
CREATE TABLE swiss_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_type TEXT UNIQUE NOT NULL, -- 'card', 'twint', 'postfinance', 'sofort'
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  supports_chf BOOLEAN DEFAULT TRUE,
  processing_fee_percentage DECIMAL(5,3) DEFAULT 0.029, -- 2.9% default
  icon_url TEXT,
  
  -- Swiss specific configuration
  requires_bank_account BOOLEAN DEFAULT FALSE,
  requires_phone_verification BOOLEAN DEFAULT FALSE,
  max_amount INTEGER, -- Max amount in Rappen
  min_amount INTEGER DEFAULT 100, -- Min amount in Rappen (1 CHF)
  
  -- Availability
  available_from TIME,
  available_to TIME,
  business_days_only BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Swiss payment methods
INSERT INTO swiss_payment_methods (method_type, display_name, description, processing_fee_percentage, icon_url, max_amount) VALUES
('card', 'Kreditkarte', 'Visa, Mastercard, American Express', 0.029, '/icons/payment/card.svg', 1000000), -- 10,000 CHF
('twint', 'TWINT', 'Schweizer Mobile Payment', 0.015, '/icons/payment/twint.svg', 500000), -- 5,000 CHF
('postfinance', 'PostFinance', 'E-Finance & PostFinance Card', 0.018, '/icons/payment/postfinance.svg', 1000000), -- 10,000 CHF
('sofort', 'Sofort', 'Online Banking', 0.014, '/icons/payment/sofort.svg', 500000); -- 5,000 CHF

-- Refunds tracking
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_refund_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT NOT NULL REFERENCES payment_intents(stripe_payment_intent_id),
  order_id UUID NOT NULL REFERENCES orders(id),
  
  -- Refund Details
  amount INTEGER NOT NULL, -- Amount in Rappen
  currency CHAR(3) DEFAULT 'CHF',
  reason TEXT CHECK (reason IN ('duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured_charge')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  -- Processing
  processed_by UUID REFERENCES profiles(id),
  internal_reason TEXT,
  customer_notification_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  stripe_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_refund_amount CHECK (amount > 0)
);

-- =====================================
-- Swiss Invoice System
-- =====================================

-- Swiss business information
CREATE TABLE swiss_business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  
  -- Address
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  canton TEXT NOT NULL,
  country CHAR(2) DEFAULT 'CH',
  
  -- Swiss Business Identifiers
  vat_number TEXT NOT NULL, -- CHE-XXX.XXX.XXX MWST
  uid_number TEXT, -- Swiss enterprise identifier
  commercial_register_number TEXT,
  
  -- Contact Information
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  website_url TEXT,
  
  -- Banking
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  
  -- Legal
  legal_form TEXT, -- 'GmbH', 'AG', 'Einzelfirma', etc.
  registration_date DATE,
  
  -- System
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Swiss VAT number validation
  CONSTRAINT valid_vat_format CHECK (vat_number ~ '^CHE-\d{3}\.\d{3}\.\d{3}(\sMWST)?$')
);

-- Insert default business info
INSERT INTO swiss_business_info (
  business_name, 
  address_line_1, 
  postal_code, 
  city, 
  canton, 
  vat_number,
  contact_email,
  contact_phone
) VALUES (
  'Schnittwerk Hair Salon',
  'Musterstrasse 123',
  '8000',
  'Zürich',
  'ZH',
  'CHE-123.456.789 MWST',
  'info@schnittwerk.ch',
  '+41 44 123 45 67'
);

-- Swiss invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_info_id UUID NOT NULL REFERENCES swiss_business_info(id),
  
  -- Invoice Identification
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Customer Information (stored as JSONB for flexibility)
  customer_data JSONB NOT NULL, -- { name, address, vat_number?, email, phone }
  
  -- Financial Details
  line_items JSONB NOT NULL, -- Array of invoice line items
  subtotal INTEGER NOT NULL, -- Amount in Rappen
  vat_amount INTEGER NOT NULL, -- VAT amount in Rappen  
  total_amount INTEGER NOT NULL, -- Total in Rappen
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Payment Terms
  payment_terms TEXT DEFAULT 'Zahlbar innerhalb 30 Tagen',
  early_payment_discount_percentage DECIMAL(5,2) DEFAULT 0,
  early_payment_discount_days INTEGER DEFAULT 0,
  
  -- Status and Processing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- File Management
  pdf_generated BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  sent_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    subtotal > 0 AND 
    vat_amount >= 0 AND 
    total_amount > subtotal
  ),
  CONSTRAINT valid_due_date CHECK (due_date >= invoice_date),
  CONSTRAINT valid_early_payment CHECK (
    early_payment_discount_days <= 30 AND
    early_payment_discount_percentage <= 10.00
  )
);

-- Payment status tracking for orders
CREATE TABLE order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_intent_id UUID REFERENCES payment_intents(id),
  invoice_id UUID REFERENCES invoices(id),
  
  -- Payment Details
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'deposit', 'installment')),
  amount INTEGER NOT NULL, -- Amount in Rappen
  currency CHAR(3) DEFAULT 'CHF',
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  
  -- Payment Method Used
  payment_method_type TEXT,
  payment_method_details JSONB,
  
  -- Processing Information
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  external_transaction_id TEXT, -- Stripe, TWINT, etc. transaction ID
  
  -- Customer Communication
  confirmation_sent BOOLEAN DEFAULT FALSE,
  receipt_sent BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

-- =====================================
-- Swiss VAT Reporting
-- =====================================

-- VAT reporting periods
CREATE TABLE vat_reporting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- VAT Calculations
  total_sales_amount INTEGER DEFAULT 0, -- In Rappen
  total_vat_amount INTEGER DEFAULT 0, -- In Rappen
  sales_count INTEGER DEFAULT 0,
  
  -- Reporting Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'calculated', 'submitted', 'paid')),
  calculated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  
  -- File Management
  report_generated BOOLEAN DEFAULT FALSE,
  report_pdf_url TEXT,
  submission_receipt TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_quarter UNIQUE(year, quarter),
  CONSTRAINT valid_quarter_dates CHECK (period_end > period_start)
);

-- =====================================
-- Payment Analytics and Reporting
-- =====================================

-- Daily payment summary
CREATE TABLE daily_payment_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL UNIQUE,
  
  -- Transaction Counts
  total_transactions INTEGER DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  refunded_transactions INTEGER DEFAULT 0,
  
  -- Amounts in Rappen
  total_amount INTEGER DEFAULT 0,
  successful_amount INTEGER DEFAULT 0,
  refunded_amount INTEGER DEFAULT 0,
  processing_fees INTEGER DEFAULT 0,
  net_amount INTEGER DEFAULT 0,
  vat_collected INTEGER DEFAULT 0,
  
  -- Payment Method Breakdown
  card_transactions INTEGER DEFAULT 0,
  card_amount INTEGER DEFAULT 0,
  twint_transactions INTEGER DEFAULT 0,
  twint_amount INTEGER DEFAULT 0,
  postfinance_transactions INTEGER DEFAULT 0,
  postfinance_amount INTEGER DEFAULT 0,
  other_transactions INTEGER DEFAULT 0,
  other_amount INTEGER DEFAULT 0,
  
  -- System
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- Functions and Triggers
-- =====================================

-- Function to calculate daily payment summaries
CREATE OR REPLACE FUNCTION calculate_daily_payment_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  summary_record daily_payment_summaries%ROWTYPE;
BEGIN
  -- Calculate payment statistics for the target date
  SELECT 
    target_date,
    COUNT(*) as total_transactions,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful_transactions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as successful_amount,
    COALESCE(SUM(processing_fee), 0) as processing_fees,
    COALESCE(SUM(vat_amount), 0) as vat_collected,
    COUNT(*) FILTER (WHERE 'card' = ANY(payment_method_types)) as card_transactions,
    COALESCE(SUM(amount) FILTER (WHERE 'card' = ANY(payment_method_types) AND status = 'succeeded'), 0) as card_amount,
    COUNT(*) FILTER (WHERE 'twint' = ANY(payment_method_types)) as twint_transactions,
    COALESCE(SUM(amount) FILTER (WHERE 'twint' = ANY(payment_method_types) AND status = 'succeeded'), 0) as twint_amount,
    COUNT(*) FILTER (WHERE 'postfinance' = ANY(payment_method_types)) as postfinance_transactions,
    COALESCE(SUM(amount) FILTER (WHERE 'postfinance' = ANY(payment_method_types) AND status = 'succeeded'), 0) as postfinance_amount
  INTO 
    summary_record.summary_date,
    summary_record.total_transactions,
    summary_record.successful_transactions,
    summary_record.failed_transactions,
    summary_record.total_amount,
    summary_record.successful_amount,
    summary_record.processing_fees,
    summary_record.vat_collected,
    summary_record.card_transactions,
    summary_record.card_amount,
    summary_record.twint_transactions,
    summary_record.twint_amount,
    summary_record.postfinance_transactions,
    summary_record.postfinance_amount
  FROM payment_intents 
  WHERE DATE(created_at) = target_date;

  -- Calculate refunds for the date
  SELECT 
    COUNT(*) FILTER (WHERE status = 'succeeded') as refunded_transactions,
    COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as refunded_amount
  INTO 
    summary_record.refunded_transactions,
    summary_record.refunded_amount
  FROM refunds 
  WHERE DATE(created_at) = target_date;

  -- Calculate net amount
  summary_record.net_amount := summary_record.successful_amount - summary_record.refunded_amount - summary_record.processing_fees;
  
  -- Insert or update the summary
  INSERT INTO daily_payment_summaries (
    summary_date, total_transactions, successful_transactions, failed_transactions,
    refunded_transactions, total_amount, successful_amount, refunded_amount,
    processing_fees, net_amount, vat_collected, card_transactions, card_amount,
    twint_transactions, twint_amount, postfinance_transactions, postfinance_amount,
    calculated_at, is_final
  ) VALUES (
    summary_record.summary_date, summary_record.total_transactions, summary_record.successful_transactions,
    summary_record.failed_transactions, summary_record.refunded_transactions, summary_record.total_amount,
    summary_record.successful_amount, summary_record.refunded_amount, summary_record.processing_fees,
    summary_record.net_amount, summary_record.vat_collected, summary_record.card_transactions,
    summary_record.card_amount, summary_record.twint_transactions, summary_record.twint_amount,
    summary_record.postfinance_transactions, summary_record.postfinance_amount, NOW(),
    target_date < CURRENT_DATE -- Mark as final if it's a past date
  )
  ON CONFLICT (summary_date) 
  DO UPDATE SET
    total_transactions = EXCLUDED.total_transactions,
    successful_transactions = EXCLUDED.successful_transactions,
    failed_transactions = EXCLUDED.failed_transactions,
    refunded_transactions = EXCLUDED.refunded_transactions,
    total_amount = EXCLUDED.total_amount,
    successful_amount = EXCLUDED.successful_amount,
    refunded_amount = EXCLUDED.refunded_amount,
    processing_fees = EXCLUDED.processing_fees,
    net_amount = EXCLUDED.net_amount,
    vat_collected = EXCLUDED.vat_collected,
    card_transactions = EXCLUDED.card_transactions,
    card_amount = EXCLUDED.card_amount,
    twint_transactions = EXCLUDED.twint_transactions,
    twint_amount = EXCLUDED.twint_amount,
    postfinance_transactions = EXCLUDED.postfinance_transactions,
    postfinance_amount = EXCLUDED.postfinance_amount,
    calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_year TEXT;
  invoice_month TEXT;
  sequence_num INTEGER;
BEGIN
  invoice_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  invoice_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^INV-' || invoice_year || invoice_month || '-\d+$')
      THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || invoice_year || invoice_month || '-') + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || invoice_year || invoice_month || '-%';
  
  RETURN 'INV-' || invoice_year || invoice_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- Indexes and Performance
-- =====================================

-- Payment processing indexes
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_order ON payment_intents(order_id);
CREATE INDEX idx_payment_intents_customer ON payment_intents(customer_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_created ON payment_intents(created_at);
CREATE INDEX idx_payment_intents_amount ON payment_intents(amount);

-- Refunds indexes
CREATE INDEX idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_payment_intent ON refunds(payment_intent_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created ON refunds(created_at);

-- Invoice indexes
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_customer_email ON invoices((customer_data->>'email'));

-- Payment tracking indexes
CREATE INDEX idx_order_payments_order ON order_payments(order_id);
CREATE INDEX idx_order_payments_status ON order_payments(status);
CREATE INDEX idx_order_payments_created ON order_payments(created_at);

-- Analytics indexes
CREATE INDEX idx_daily_summaries_date ON daily_payment_summaries(summary_date);
CREATE INDEX idx_vat_periods_year_quarter ON vat_reporting_periods(year, quarter);

-- =====================================
-- Update Triggers
-- =====================================

CREATE TRIGGER update_payment_intents_updated_at 
  BEFORE UPDATE ON payment_intents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at 
  BEFORE UPDATE ON refunds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_payments_updated_at 
  BEFORE UPDATE ON order_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swiss_business_info_updated_at 
  BEFORE UPDATE ON swiss_business_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_payment_summaries_updated_at 
  BEFORE UPDATE ON daily_payment_summaries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- Swiss Compliance Views
-- =====================================

-- VAT summary view for reporting
CREATE VIEW swiss_vat_summary AS
SELECT 
  DATE_TRUNC('month', pi.created_at) as month,
  COUNT(*) as total_transactions,
  SUM(pi.amount) as total_amount_rappen,
  SUM(pi.vat_amount) as total_vat_rappen,
  ROUND(SUM(pi.amount) / 100.0, 2) as total_amount_chf,
  ROUND(SUM(pi.vat_amount) / 100.0, 2) as total_vat_chf,
  COUNT(*) FILTER (WHERE pi.status = 'succeeded') as successful_transactions,
  SUM(pi.amount) FILTER (WHERE pi.status = 'succeeded') as successful_amount_rappen
FROM payment_intents pi
WHERE pi.status = 'succeeded'
  AND pi.currency = 'CHF'
  AND pi.created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', pi.created_at)
ORDER BY month DESC;

-- Payment method performance view
CREATE VIEW payment_method_analytics AS
SELECT 
  method_type,
  COUNT(*) as transaction_count,
  SUM(pi.amount) as total_amount_rappen,
  ROUND(AVG(pi.amount), 0) as avg_amount_rappen,
  ROUND(SUM(pi.amount) / 100.0, 2) as total_amount_chf,
  COUNT(*) FILTER (WHERE pi.status = 'succeeded') as successful_count,
  ROUND(
    COUNT(*) FILTER (WHERE pi.status = 'succeeded')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percentage
FROM payment_intents pi
JOIN unnest(pi.payment_method_types) as method_type ON true
WHERE pi.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY method_type
ORDER BY transaction_count DESC;

-- Outstanding invoices view
CREATE VIEW outstanding_invoices AS
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  CURRENT_DATE - i.due_date as days_overdue,
  i.total_amount,
  ROUND(i.total_amount / 100.0, 2) as total_amount_chf,
  i.customer_data->>'name' as customer_name,
  i.customer_data->>'email' as customer_email,
  i.status,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'current'
  END as urgency
FROM invoices i
WHERE i.status IN ('sent', 'viewed', 'partially_paid')
ORDER BY 
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 1
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 2
    ELSE 3
  END,
  i.due_date ASC;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;