-- Swiss VAT calculation function
CREATE OR REPLACE FUNCTION calculate_swiss_vat(
    amount DECIMAL(10,2),
    vat_rate DECIMAL(5,2) DEFAULT 7.7
)
RETURNS TABLE (
    net_amount DECIMAL(10,2),
    vat_amount DECIMAL(10,2),
    gross_amount DECIMAL(10,2)
) AS $$
BEGIN
    -- Ensure VAT rate is valid
    IF vat_rate < 0 OR vat_rate > 100 THEN
        RAISE EXCEPTION 'Invalid VAT rate: %', vat_rate;
    END IF;
    
    -- Calculate amounts with Swiss rounding (0.05 CHF precision)
    net_amount := ROUND(amount::numeric, 2);
    vat_amount := ROUND((amount * vat_rate / 100)::numeric, 2);
    gross_amount := ROUND((net_amount + vat_amount)::numeric, 2);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Swiss invoice number generation function
CREATE OR REPLACE FUNCTION generate_swiss_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    current_month INTEGER;
    sequence_number INTEGER;
    invoice_number VARCHAR(50);
BEGIN
    -- Get current year and month
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM invoices
    WHERE EXTRACT(YEAR FROM issue_date) = current_year
    AND EXTRACT(MONTH FROM issue_date) = current_month;
    
    -- Format: INV-YYYY-MM-NNNNN
    invoice_number := 'INV-' || 
                     TO_CHAR(current_year, 'FM0000') || '-' || 
                     TO_CHAR(current_month, 'FM00') || '-' || 
                     TO_CHAR(sequence_number, 'FM00000');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Swiss order number generation function
CREATE OR REPLACE FUNCTION generate_swiss_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_date DATE;
    sequence_number INTEGER;
    order_number VARCHAR(50);
BEGIN
    current_date := CURRENT_DATE;
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM orders
    WHERE DATE(created_at) = current_date;
    
    -- Format: ORD-YYYYMMDD-NNNN
    order_number := 'ORD-' || 
                   TO_CHAR(current_date, 'YYYYMMDD') || '-' || 
                   TO_CHAR(sequence_number, 'FM0000');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Voucher validation function
CREATE OR REPLACE FUNCTION validate_voucher(
    voucher_code VARCHAR(50),
    customer_id UUID,
    order_amount DECIMAL(10,2)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    voucher_id UUID,
    discount_amount DECIMAL(10,2),
    error_message TEXT
) AS $$
DECLARE
    v_record RECORD;
    v_discount DECIMAL(10,2);
    v_usage_count INTEGER;
BEGIN
    -- Check if voucher exists and is active
    SELECT * INTO v_record
    FROM vouchers
    WHERE code = voucher_code
    AND is_active = true
    AND deleted_at IS NULL
    AND valid_from <= CURRENT_DATE
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL, 0.00, 'Voucher not found or expired';
        RETURN;
    END IF;
    
    -- Check if voucher has remaining uses
    IF v_record.used_count >= v_record.max_uses THEN
        RETURN QUERY SELECT false, NULL, 0.00, 'Voucher has reached maximum usage';
        RETURN;
    END IF;
    
    -- Check customer usage limit
    SELECT COUNT(*) INTO v_usage_count
    FROM voucher_usage
    WHERE voucher_id = v_record.id
    AND customer_id = validate_voucher.customer_id;
    
    IF v_usage_count >= v_record.max_uses_per_customer THEN
        RETURN QUERY SELECT false, NULL, 0.00, 'Customer has already used this voucher';
        RETURN;
    END IF;
    
    -- Check minimum order amount
    IF order_amount < v_record.min_order_amount THEN
        RETURN QUERY SELECT false, NULL, 0.00, 
                    'Minimum order amount of CHF ' || v_record.min_order_amount || ' required';
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_record.voucher_type = 'percentage' THEN
        v_discount := ROUND((order_amount * v_record.discount_value / 100)::numeric, 2);
    ELSE
        v_discount := LEAST(v_record.discount_value, order_amount);
    END IF;
    
    RETURN QUERY SELECT true, v_record.id, v_discount, NULL;
END;
$$ LANGUAGE plpgsql;

-- Revenue analytics function
CREATE OR REPLACE FUNCTION get_revenue_analytics(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    date DATE,
    gross_revenue DECIMAL(10,2),
    net_revenue DECIMAL(10,2),
    vat_collected DECIMAL(10,2),
    order_count INTEGER,
    average_order_value DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(o.created_at) as date,
        SUM(o.total_amount) as gross_revenue,
        SUM(o.total_amount - o.vat_amount) as net_revenue,
        SUM(o.vat_amount) as vat_collected,
        COUNT(*) as order_count,
        ROUND((SUM(o.total_amount) / COUNT(*))::numeric, 2) as average_order_value
    FROM orders o
    WHERE DATE(o.created_at) BETWEEN start_date AND end_date
    AND o.status IN ('completed', 'confirmed')
    AND o.deleted_at IS NULL
    GROUP BY DATE(o.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Invoice PDF generation trigger
CREATE OR REPLACE FUNCTION generate_invoice_pdf()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called after invoice creation
    -- In production, this would trigger PDF generation service
    -- For now, we'll just set a placeholder
    NEW.pdf_url := 'https://placeholder.com/invoices/' || NEW.invoice_number || '.pdf';
    NEW.pdf_path := 'invoices/' || NEW.invoice_number || '.pdf';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_invoice_pdf
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_pdf();

-- Order total calculation trigger
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_vat_amount DECIMAL(10,2);
    v_total DECIMAL(10,2);
    v_vat_rate DECIMAL(5,2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Get VAT rate (default 7.7%)
    v_vat_rate := 7.7;
    
    -- Calculate VAT and total
    v_vat_amount := ROUND((v_subtotal * v_vat_rate / 100)::numeric, 2);
    v_total := v_subtotal + v_vat_amount;
    
    -- Update order totals
    NEW.subtotal := v_subtotal;
    NEW.vat_amount := v_vat_amount;
    NEW.total_amount := v_total;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_order_totals
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_totals();

-- Financial transaction creation trigger
CREATE OR REPLACE FUNCTION create_financial_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_transaction_type transaction_type;
    v_description TEXT;
BEGIN
    -- Determine transaction type based on payment status
    IF NEW.status = 'succeeded' THEN
        v_transaction_type := 'payment';
        v_description := 'Payment for order ' || (SELECT order_number FROM orders WHERE id = NEW.order_id);
    ELSIF NEW.status = 'refunded' THEN
        v_transaction_type := 'refund';
        v_description := 'Refund for order ' || (SELECT order_number FROM orders WHERE id = NEW.order_id);
    ELSE
        RETURN NEW;
    END IF;
    
    -- Create financial transaction
    INSERT INTO financial_transactions (
        customer_id,
        order_id,
        payment_id,
        transaction_type,
        amount,
        currency,
        description,
        vat_rate,
        vat_amount,
        net_amount,
        gross_amount,
        created_by
    ) VALUES (
        NEW.customer_id,
        NEW.order_id,
        NEW.id,
        v_transaction_type,
        NEW.amount,
        NEW.currency,
        v_description,
        NEW.vat_rate,
        NEW.vat_amount,
        NEW.amount - NEW.vat_amount,
        NEW.amount,
        NEW.customer_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_financial_transaction
    AFTER UPDATE ON payments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('succeeded', 'refunded'))
    EXECUTE FUNCTION create_financial_transaction();