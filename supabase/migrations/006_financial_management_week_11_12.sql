-- Sprint C Week 11-12: Financial Management and Business Analytics Enhancement
-- Advanced financial tracking, automated reporting, and Swiss compliance features

BEGIN;

-- Create financial transactions table with Swiss compliance
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type transaction_type_enum NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) DEFAULT 'CHF',
  
  -- References
  customer_id UUID REFERENCES profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  order_id UUID REFERENCES orders(id),
  staff_id UUID REFERENCES staff(id),
  
  -- Payment details
  payment_method payment_method_enum,
  payment_reference TEXT,
  
  -- Swiss VAT compliance
  vat_rate DECIMAL(5,2) DEFAULT 7.70,
  vat_amount DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  
  -- Metadata
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Accounting
  accounting_period TEXT NOT NULL,
  is_reconciled BOOLEAN DEFAULT FALSE,
  
  -- Swiss compliance
  tax_period TEXT,
  audit_reference TEXT
);

-- Enhanced analytics_daily table for comprehensive reporting
ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS 
  commission_paid DECIMAL(10,2) DEFAULT 0,
  operating_expenses DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  customer_satisfaction DECIMAL(3,2) DEFAULT 0,
  staff_utilization DECIMAL(5,2) DEFAULT 0,
  no_show_rate DECIMAL(5,2) DEFAULT 0,
  average_service_time INTEGER DEFAULT 0;

-- Create customer segmentation table
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  segment_name TEXT NOT NULL,
  segment_value DECIMAL(10,2),
  lifetime_value DECIMAL(10,2),
  retention_probability DECIMAL(3,2),
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, segment_name)
);

-- Create automated reporting configuration
CREATE TABLE IF NOT EXISTS automated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type report_type_enum NOT NULL,
  frequency frequency_enum NOT NULL,
  recipients TEXT[] NOT NULL,
  last_sent TIMESTAMPTZ,
  next_scheduled TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  configuration JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance metrics tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  target_value DECIMAL(12,4),
  metric_unit TEXT,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  category TEXT NOT NULL, -- 'financial', 'operational', 'customer', 'staff'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(metric_name, measurement_date, period_type)
);

-- Create Swiss VAT reporting table
CREATE TABLE IF NOT EXISTS swiss_vat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_period TEXT NOT NULL, -- YYYY-MM format
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- VAT amounts
  total_revenue DECIMAL(12,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 7.70,
  vat_amount DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  
  -- Transaction details
  transaction_count INTEGER NOT NULL,
  report_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(reporting_period)
);

-- Create business insights table
CREATE TABLE IF NOT EXISTS business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- 'trend', 'opportunity', 'alert', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_rating INTEGER CHECK (impact_rating BETWEEN 1 AND 5),
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Data context
  data_source TEXT,
  metric_context JSONB,
  period_analyzed DATERANGE,
  
  -- Action tracking
  action_taken BOOLEAN DEFAULT FALSE,
  action_notes TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_by TEXT DEFAULT 'system',
  category TEXT
);

-- Create enums
DO $$ BEGIN
  CREATE TYPE transaction_type_enum AS ENUM (
    'appointment_payment', 'product_sale', 'refund', 'discount', 
    'commission_payment', 'expense', 'adjustment', 'tax_payment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM (
    'cash', 'card', 'twint', 'postfinance', 'bank_transfer', 'voucher', 'online', 'sofort'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_type_enum AS ENUM (
    'daily_summary', 'weekly_report', 'monthly_report', 'quarterly_vat', 
    'annual_summary', 'financial_overview', 'performance_dashboard'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE frequency_enum AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_customer ON financial_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_period ON financial_transactions(accounting_period);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(category);
CREATE INDEX IF NOT EXISTS idx_customer_segments_customer ON customer_segments(customer_id);
CREATE INDEX IF NOT EXISTS idx_business_insights_type ON business_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_business_insights_created ON business_insights(created_at);

-- Views for reporting
CREATE OR REPLACE VIEW financial_dashboard_view AS
SELECT 
  DATE_TRUNC('month', transaction_date) as month,
  SUM(CASE WHEN transaction_type IN ('appointment_payment', 'product_sale') THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN transaction_type = 'appointment_payment' THEN amount ELSE 0 END) as appointment_revenue,
  SUM(CASE WHEN transaction_type = 'product_sale' THEN amount ELSE 0 END) as product_revenue,
  SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END) as refunds,
  SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses,
  SUM(vat_amount) as total_vat,
  COUNT(*) as transaction_count
FROM financial_transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month DESC;

-- Swiss VAT summary view
CREATE OR REPLACE VIEW swiss_vat_summary_view AS
SELECT 
  EXTRACT(YEAR FROM transaction_date) as year,
  EXTRACT(QUARTER FROM transaction_date) as quarter,
  SUM(amount) as total_revenue,
  SUM(vat_amount) as total_vat,
  SUM(net_amount) as total_net,
  COUNT(*) as transaction_count
FROM financial_transactions
WHERE transaction_type IN ('appointment_payment', 'product_sale')
  AND transaction_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(QUARTER FROM transaction_date)
ORDER BY year DESC, quarter DESC;

-- Customer value analysis view
CREATE OR REPLACE VIEW customer_value_analysis AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  cs.segment_name,
  cs.lifetime_value,
  cs.retention_probability,
  COUNT(ft.id) as transaction_count,
  SUM(CASE WHEN ft.transaction_type IN ('appointment_payment', 'product_sale') THEN ft.amount ELSE 0 END) as total_spent,
  MAX(ft.transaction_date) as last_transaction_date,
  AVG(ft.amount) as average_transaction_value
FROM profiles p
LEFT JOIN customer_segments cs ON p.id = cs.customer_id
LEFT JOIN financial_transactions ft ON p.id = ft.customer_id
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.email, cs.segment_name, cs.lifetime_value, cs.retention_probability;

-- Performance KPI view
CREATE OR REPLACE VIEW performance_kpi_view AS
SELECT 
  measurement_date,
  MAX(CASE WHEN metric_name = 'daily_revenue' THEN metric_value END) as daily_revenue,
  MAX(CASE WHEN metric_name = 'booking_rate' THEN metric_value END) as booking_rate,
  MAX(CASE WHEN metric_name = 'customer_satisfaction' THEN metric_value END) as customer_satisfaction,
  MAX(CASE WHEN metric_name = 'staff_utilization' THEN metric_value END) as staff_utilization,
  MAX(CASE WHEN metric_name = 'no_show_rate' THEN metric_value END) as no_show_rate,
  MAX(CASE WHEN metric_name = 'average_service_time' THEN metric_value END) as average_service_time
FROM performance_metrics
WHERE measurement_date >= CURRENT_DATE - INTERVAL '30 days'
  AND period_type = 'daily'
GROUP BY measurement_date
ORDER BY measurement_date DESC;

-- Functions for automated calculations
CREATE OR REPLACE FUNCTION calculate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  revenue_data RECORD;
  performance_data RECORD;
BEGIN
  -- Calculate daily revenue metrics
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('appointment_payment', 'product_sale') THEN amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN transaction_type = 'appointment_payment' THEN amount ELSE 0 END), 0) as appointment_revenue,
    COALESCE(SUM(CASE WHEN transaction_type = 'product_sale' THEN amount ELSE 0 END), 0) as product_revenue,
    COALESCE(SUM(vat_amount), 0) as vat_amount,
    COUNT(*) as total_transactions
  INTO revenue_data
  FROM financial_transactions
  WHERE transaction_date = target_date;

  -- Insert or update analytics_daily
  INSERT INTO analytics_daily (
    date, total_revenue, appointment_revenue, product_revenue, 
    vat_amount, total_transactions, computed_at
  ) VALUES (
    target_date, revenue_data.total_revenue, revenue_data.appointment_revenue, 
    revenue_data.product_revenue, revenue_data.vat_amount, revenue_data.total_transactions, NOW()
  ) ON CONFLICT (date) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    appointment_revenue = EXCLUDED.appointment_revenue,
    product_revenue = EXCLUDED.product_revenue,
    vat_amount = EXCLUDED.vat_amount,
    total_transactions = EXCLUDED.total_transactions,
    computed_at = NOW();

  -- Calculate performance metrics
  INSERT INTO performance_metrics (metric_name, metric_value, measurement_date, period_type, category)
  VALUES 
    ('daily_revenue', revenue_data.total_revenue, target_date, 'daily', 'financial'),
    ('daily_transactions', revenue_data.total_transactions, target_date, 'daily', 'operational')
  ON CONFLICT (metric_name, measurement_date, period_type) DO UPDATE SET
    metric_value = EXCLUDED.metric_value;
    
END;
$$ LANGUAGE plpgsql;

-- Function to generate VAT report
CREATE OR REPLACE FUNCTION generate_vat_report(report_period TEXT)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  period_start DATE;
  period_end DATE;
  vat_data RECORD;
BEGIN
  -- Parse period (YYYY-MM format)
  period_start := (report_period || '-01')::DATE;
  period_end := (period_start + INTERVAL '1 month - 1 day')::DATE;
  
  -- Calculate VAT data
  SELECT 
    SUM(amount) as total_revenue,
    SUM(vat_amount) as vat_amount,
    SUM(net_amount) as net_amount,
    COUNT(*) as transaction_count
  INTO vat_data
  FROM financial_transactions
  WHERE transaction_date BETWEEN period_start AND period_end
    AND transaction_type IN ('appointment_payment', 'product_sale');

  -- Insert VAT report
  INSERT INTO swiss_vat_reports (
    reporting_period, quarter, year, total_revenue, vat_amount, 
    net_amount, transaction_count, report_data
  ) VALUES (
    report_period,
    EXTRACT(QUARTER FROM period_start),
    EXTRACT(YEAR FROM period_start),
    COALESCE(vat_data.total_revenue, 0),
    COALESCE(vat_data.vat_amount, 0),
    COALESCE(vat_data.net_amount, 0),
    COALESCE(vat_data.transaction_count, 0),
    jsonb_build_object(
      'period_start', period_start,
      'period_end', period_end,
      'generated_at', NOW()
    )
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics when transactions are added
CREATE OR REPLACE FUNCTION update_analytics_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_daily_analytics(NEW.transaction_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analytics ON financial_transactions;
CREATE TRIGGER trigger_update_analytics
  AFTER INSERT OR UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_on_transaction();

-- Insert sample data for development/testing
INSERT INTO financial_transactions (
  transaction_type, amount, currency, payment_method, description, 
  transaction_date, accounting_period, vat_amount, net_amount
) VALUES 
  ('appointment_payment', 120.00, 'CHF', 'card', 'Schnitt + Föhnen', CURRENT_DATE - 1, '2024-01', 9.24, 110.76),
  ('product_sale', 45.00, 'CHF', 'cash', 'Shampoo Trinity', CURRENT_DATE - 1, '2024-01', 3.47, 41.53),
  ('appointment_payment', 180.00, 'CHF', 'twint', 'Färben + Schnitt', CURRENT_DATE, '2024-01', 13.86, 166.14),
  ('product_sale', 25.00, 'CHF', 'card', 'Stylingprodukt', CURRENT_DATE, '2024-01', 1.93, 23.07)
ON CONFLICT DO NOTHING;

-- Insert sample performance metrics
INSERT INTO performance_metrics (
  metric_name, metric_value, target_value, metric_unit, 
  measurement_date, period_type, category
) VALUES 
  ('customer_satisfaction', 4.7, 4.5, '/5', CURRENT_DATE, 'daily', 'customer'),
  ('staff_utilization', 87.5, 85.0, '%', CURRENT_DATE, 'daily', 'operational'),
  ('booking_rate', 18.5, 15.0, '%', CURRENT_DATE, 'daily', 'operational'),
  ('no_show_rate', 3.2, 5.0, '%', CURRENT_DATE, 'daily', 'operational')
ON CONFLICT (metric_name, measurement_date, period_type) DO NOTHING;

-- Insert sample business insights
INSERT INTO business_insights (
  insight_type, title, description, impact_rating, confidence_score, 
  category, data_source, period_analyzed
) VALUES 
  ('opportunity', 'VIP Customer Upselling', 'VIP customers show 45% higher willingness to purchase premium services', 4, 0.89, 'revenue', 'customer_analytics', '[2024-01-01,2024-01-31]'),
  ('trend', 'Weekend Revenue Peak', 'Saturday appointments generate 25% more revenue than weekday average', 3, 0.92, 'operational', 'financial_analytics', '[2024-01-01,2024-01-31]'),
  ('alert', 'Declining Product Sales', 'Product sales down 8% compared to last month', 3, 0.85, 'revenue', 'sales_analytics', '[2024-01-01,2024-01-31]')
ON CONFLICT DO NOTHING;

-- Create RLS policies for new tables
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE swiss_vat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_insights ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "admin_full_access_financial_transactions" ON financial_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "admin_full_access_performance_metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "admin_full_access_swiss_vat_reports" ON swiss_vat_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Customer access to their own segments
CREATE POLICY "customers_own_segments" ON customer_segments
  FOR SELECT USING (customer_id = auth.uid());

-- Staff access to business insights
CREATE POLICY "staff_business_insights" ON business_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'staff')
    )
  );

COMMIT;

-- Add comment
COMMENT ON TABLE financial_transactions IS 'Sprint C Week 11-12: Complete financial transaction tracking with Swiss compliance';
COMMENT ON TABLE performance_metrics IS 'Sprint C Week 11-12: Real-time KPI and performance tracking';
COMMENT ON TABLE swiss_vat_reports IS 'Sprint C Week 11-12: Automated Swiss VAT compliance reporting';
COMMENT ON TABLE business_insights IS 'Sprint C Week 11-12: AI-driven business insights and recommendations';
COMMENT ON FUNCTION calculate_daily_analytics IS 'Automated daily analytics calculation for financial performance tracking';
COMMENT ON FUNCTION generate_vat_report IS 'Generate Swiss VAT compliance report for specified period';