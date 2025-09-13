# Schnittwerk Salon - Supabase Backend Setup

This directory contains the complete Supabase backend infrastructure for the Schnittwerk hair salon payment and invoice system.

## Project Structure

```
supabase/
├── config.toml              # Supabase project configuration
├── migrations/              # Database migration files
│   ├── 20240912000000_initial_schema.sql     # Core financial tables
│   ├── 20240912000001_supporting_tables.sql   # Supporting tables
│   ├── 20240912000002_rls_policies.sql        # Row Level Security policies
│   └── 20240912000003_swiss_functions.sql     # Swiss business logic functions
├── seed.sql                # Initial data seeding
└── README.md               # This file
```

## Swiss Compliance Features

### VAT Calculations
- **Precision**: All VAT calculations use 2 decimal places (CHF 0.05 precision)
- **Standard Rate**: 7.7% for services (configurable)
- **Automatic Calculation**: Triggers automatically calculate VAT amounts
- **Audit Trail**: All VAT amounts are stored for compliance

### Invoice Numbering
- **Format**: `INV-YYYY-MM-NNNNN` (e.g., INV-2024-09-00001)
- **Sequential**: Numbers reset monthly for Swiss commercial standards
- **Unique**: Each invoice has a unique identifier
- **Year/Month**: Includes year and month for easy identification

### Financial Data
- **Audit Trail**: All changes tracked with created_by/updated_by
- **Soft Delete**: Data is never permanently deleted
- **Immutable**: Financial transactions cannot be modified after creation
- **GDPR Compliant**: Customer data can be anonymized on request

## Database Schema

### Core Financial Tables
- `financial_transactions`: Complete ledger of all money movements
- `invoices`: Swiss-compliant invoice records with PDF links
- `payments`: Stripe payment tracking and status management
- `orders`: Order management with status tracking
- `order_items`: Individual items within orders
- `vouchers`: Discount codes with usage tracking

### Supporting Tables
- `products`: Salon services and retail products
- `product_categories`: Organization of product catalog
- `customers`: Extended user profiles with Swiss address format
- `tax_rates`: Swiss VAT configuration
- `voucher_usage`: Tracks voucher redemptions

## Row Level Security (RLS)

### Access Levels
- **Customer**: Can only access own data
- **Staff**: Can access assigned customers/orders
- **Admin**: Full access to all data
- **Owner**: Complete system access

### Policies
- All financial data has appropriate access restrictions
- Customers can only view their own invoices and payments
- Staff can manage orders and customers
- Admins have full access to all tables

## Swiss Business Functions

### VAT Calculation
```sql
SELECT * FROM calculate_swiss_vat(100.00, 7.7);
```

### Invoice Number Generation
```sql
SELECT generate_swiss_invoice_number();
```

### Voucher Validation
```sql
SELECT * FROM validate_voucher('WELCOME10', 'user-uuid', 50.00);
```

### Revenue Analytics
```sql
SELECT * FROM get_revenue_analytics('2024-01-01', '2024-12-31');
```

## Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Initialize Project
```bash
supabase init
```

### 3. Apply Migrations
```bash
supabase db reset
supabase db push
```

### 4. Seed Data
```bash
supabase db reset --seed
```

### 5. Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials.

## Environment Variables

See `.env.example` for all required environment variables including:
- Supabase credentials
- Stripe keys
- Swiss business settings
- Feature flags

## Testing

### Run Local Development
```bash
supabase start
```

### Access Studio
```bash
supabase studio
```

## Production Deployment

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Copy project URL and anon key

### 2. Apply Migrations
```bash
supabase db push --project-ref your-project-ref
```

### 3. Configure Auth
- Set up email authentication
- Configure user roles in metadata

### 4. Set Environment Variables
Configure all environment variables in your hosting platform.

## Security Considerations

- All financial data is encrypted at rest
- RLS policies prevent unauthorized access
- API keys are stored securely
- Webhook endpoints are protected
- Rate limiting is enabled

## Monitoring

- Database performance monitoring
- Failed payment alerts
- Invoice generation logs
- VAT calculation audits

## Support

For questions about the Supabase setup, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Swiss VAT Guidelines](https://www.estv.admin.ch)
- [GDPR Compliance Guide](https://gdpr.eu)