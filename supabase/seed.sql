-- Insert default products (services and products)
INSERT INTO products (name, description, price, duration_minutes, is_service, category_id, sku) VALUES
    -- Haircuts
    ('Herrenhaarschnitt', 'Klassischer Herrenhaarschnitt mit Styling', 45.00, 30, true, 
     (SELECT id FROM product_categories WHERE name = 'Haircuts'), 'HC-MEN-001'),
    ('Damenhaarschnitt', 'Damenhaarschnitt mit Waschen und Styling', 65.00, 45, true, 
     (SELECT id FROM product_categories WHERE name = 'Haircuts'), 'HC-WOMEN-001'),
    ('Kurzhaarschnitt', 'Kurzhaarschnitt für Damen und Herren', 35.00, 30, true, 
     (SELECT id FROM product_categories WHERE name = 'Haircuts'), 'HC-SHORT-001'),
    
    -- Coloring
    ('Strähnen', 'Farbe oder Blondierung für Strähnen', 80.00, 60, true, 
     (SELECT id FROM product_categories WHERE name = 'Coloring'), 'COL-HIGH-001'),
    ('Ganzer Kopf', 'Komplette Haarfärbung', 120.00, 90, true, 
     (SELECT id FROM product_categories WHERE name = 'Coloring'), 'COL-FULL-001'),
    ('Ansatzfarbe', 'Nur Ansatz färben', 45.00, 30, true, 
     (SELECT id FROM product_categories WHERE name = 'Coloring'), 'COL-ROOT-001'),
    
    -- Treatments
    ('Kurhaarbehandlung', 'Intensive Haarkurbehandlung', 25.00, 15, true, 
     (SELECT id FROM product_categories WHERE name = 'Treatments'), 'TRT-HAIR-001'),
    ('Kopfhautbehandlung', 'Spezielle Kopfhautbehandlung', 35.00, 30, true, 
     (SELECT id FROM product_categories WHERE name = 'Treatments'), 'TRT-SCALP-001'),
    
    -- Styling
    ('Hochsteckfrisur', 'Elegante Hochsteckfrisur für besondere Anlässe', 85.00, 60, true, 
     (SELECT id FROM product_categories WHERE name = 'Styling'), 'STY-UPDO-001'),
    ('Glätten', 'Professionelles Glätten der Haare', 25.00, 20, true, 
     (SELECT id FROM product_categories WHERE name = 'Styling'), 'STY-STRAIGHT-001'),
    
    -- Products
    ('Hydrating Shampoo', 'Feuchtigkeitsspendendes Shampoo', 18.50, NULL, false, 
     (SELECT id FROM product_categories WHERE name = 'Products'), 'PROD-SHAM-001'),
    ('Repair Conditioner', 'Reparierender Conditioner', 22.00, NULL, false, 
     (SELECT id FROM product_categories WHERE name = 'Products'), 'PROD-COND-001'),
    ('Heat Protection Spray', 'Hitzeschutz-Spray', 28.00, NULL, false, 
     (SELECT id FROM product_categories WHERE name = 'Products'), 'PROD-HEAT-001'),
    
    -- Vouchers
    ('Gutschein 50 CHF', 'Gutschein über 50 CHF', 50.00, NULL, false, 
     (SELECT id FROM product_categories WHERE name = 'Vouchers'), 'VOU-50-001'),
    ('Gutschein 100 CHF', 'Gutschein über 100 CHF', 100.00, NULL, false, 
     (SELECT id FROM product_categories WHERE name = 'Vouchers'), 'VOU-100-001');

-- Insert default vouchers
INSERT INTO vouchers (code, voucher_type, discount_value, max_uses, max_uses_per_customer, valid_from, valid_until, min_order_amount) VALUES
    ('WELCOME10', 'percentage', 10.00, 100, 1, '2024-01-01', '2024-12-31', 30.00),
    ('SUMMER20', 'percentage', 20.00, 50, 1, '2024-06-01', '2024-08-31', 50.00),
    ('NEUKUNDE15', 'fixed_amount', 15.00, 200, 1, '2024-01-01', '2024-12-31', 40.00),
    ('STAFF25', 'percentage', 25.00, 1000, 10, '2024-01-01', '2024-12-31', 0.00);

-- Insert sample business settings (these would be configured in your application)
-- Note: These are just placeholder values for development
INSERT INTO customers (id, first_name, last_name, phone, street_address, zip_code, city) VALUES
    -- This will be replaced by actual auth.users records
    -- The trigger will automatically create customer records
    -- These are just for testing purposes
    (gen_random_uuid(), 'Max', 'Mustermann', '+41 79 123 45 67', 'Musterstrasse 1', '8000', 'Zürich');

-- Insert sample orders for testing
-- Note: These will be created through the application, not directly in seed
-- This is just to demonstrate the structure

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable RLS for all tables
-- This is already done in the RLS migration file, but included here for completeness