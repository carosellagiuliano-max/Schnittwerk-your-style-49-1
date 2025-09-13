# Hair Salon Transformation Plan: Mock to Production
**Project**: Schnittwerk Hair Salon - Complete Backend Integration  
**Version**: 1.0  
**Date**: January 2024  
**Status**: Ready for Implementation

---

## Executive Summary

This document provides a comprehensive roadmap for transforming the existing high-quality React frontend from a mock data system to a fully production-ready hair salon management platform using Supabase backend, Netlify deployment, and integrated payment processing.

**Current State**: Frontend-only React app with extensive mock data  
**Target State**: Full-stack application with real database, authentication, payments, and compliance features  
**Timeline**: 4 sprints (12-16 weeks)  
**Architecture**: Supabase + Netlify + Stripe + Swiss Compliance

---

## 1. Mock Data Inventory & Replacement Strategy

### 1.1 Primary Mock Data Sources

#### **📁 `/src/data/products.ts` (819 lines)**
- **Content**: 50+ products across 8 categories (Trinity Haircare, TAILOR's products, vouchers, accessories)
- **Data Types**: Product catalog, pricing (CHF), categories, descriptions, images
- **Replacement Strategy**: 
  - Create `products` table in Supabase with categories, inventory management
  - Image storage in Supabase Storage with CDN optimization
  - Price history tracking for promotional campaigns
  - Multi-language support (German/French for Swiss market)

### 1.2 Embedded Mock Data Sources

#### **👥 Customer Management (`/src/components/admin/CustomerManagement.tsx`)**
```typescript
const mockCustomers = [
  // 6 customer records with full profiles
  // Fields: id, name, gender, email, phone, appointments, totalRevenue, status, dates
]
```
- **Replacement**: `customers` + `customer_profiles` tables with RBAC
- **Features**: Loyalty status automation, GDPR compliance, communication preferences

#### **💰 Financial Data (`/src/components/admin/FinancialOverview.tsx`)**
```typescript
// Multiple datasets:
const monthlyData = [...] // 12 months revenue/appointments
const serviceBreakdown = [...] // Service performance analysis  
const dailyData = [...] // Weekly performance
const weeklyData = [...] // Monthly analysis with waiting list metrics
const yearlyData = [...] // Multi-year trends
```
- **Replacement**: Complete financial tracking system with real-time analytics
- **Features**: Swiss VAT compliance, automated reporting, tax export (PDF)

#### **📅 Calendar & Appointments (`/src/components/admin/CalendarView.tsx`)**
```typescript
const mockAppointments = [...] // 5 appointments with full details
const mockWaitingList = [...] // 3 waiting list entries with preferences
const mockEmployees = [...] // Staff management with specialties
```
- **Replacement**: Real-time booking system with conflict resolution
- **Features**: Gender-based scheduling, waiting list automation, staff optimization

#### **🛍️ E-commerce Integration (`/src/contexts/cart-context.tsx`)**
- **Current**: Frontend-only cart with CHF pricing
- **Replacement**: Full e-commerce with Stripe payment processing
- **Features**: Inventory management, Swiss payment methods, order fulfillment

#### **📊 Additional Mock Sources**
- **Customer Histories**: Appointment & purchase tracking
- **Business Settings**: Opening hours, services, pricing
- **Reviews & Content**: Google reviews, service descriptions
- **Booking Flows**: Service selection, staff assignment, time slots

### 1.3 Mock Data Migration Matrix

| Component | Mock Data Type | Records | Supabase Tables | Priority |
|-----------|----------------|---------|-----------------|----------|
| `products.ts` | Product Catalog | 50+ | `products`, `categories`, `inventory` | HIGH |
| `CustomerManagement` | Customer Profiles | 6 | `customers`, `profiles`, `loyalty_status` | HIGH |
| `FinancialOverview` | Financial Analytics | 100+ | `transactions`, `invoices`, `analytics` | HIGH |
| `CalendarView` | Appointments | 15+ | `appointments`, `staff`, `waiting_list` | CRITICAL |
| `AdminSettings` | Business Config | 10+ | `business_settings`, `services` | MEDIUM |
| `InactiveCustomers` | Customer Segments | 8 | `customer_segments`, `marketing_campaigns` | LOW |

---

## 2. Current vs Target Architecture

### 2.1 Current Architecture
```
Frontend Only:
┌─────────────────────────────────────┐
│ React 18 + TypeScript + Vite        │
│ ├── Tailwind CSS + Shadcn/ui        │
│ ├── Mock Data (products.ts + inline)│
│ ├── Context API (cart, auth sim.)   │
│ └── Static Assets + Images          │
└─────────────────────────────────────┘
```

### 2.2 Target Architecture
```
Production Stack:
┌─────────────────────────────────────┐
│ Frontend (Enhanced)                 │
│ ├── React 18 + TypeScript + Vite   │
│ ├── Tailwind + Shadcn/ui           │
│ ├── Real API Integration           │
│ ├── Authentication (Supabase)      │
│ └── Payment Processing (Stripe)    │
└─────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────┐
│ Backend Services                    │
│ ├── Supabase (Database + Auth)     │
│ ├── Row Level Security (RLS)       │
│ ├── Real-time subscriptions        │
│ ├── File Storage + CDN             │
│ └── Edge Functions                 │
└─────────────────────────────────────┘
                  ↕
┌─────────────────────────────────────┐
│ External Integrations               │
│ ├── Stripe (CHF Payments)          │
│ ├── Email/SMS Notifications        │
│ ├── Swiss Tax Export APIs          │
│ └── Calendar Sync (Google/Outlook) │
└─────────────────────────────────────┘
```

### 2.3 Technology Stack Evolution

| Layer | Current | Target | Reason |
|-------|---------|--------|--------|
| **Frontend** | React + Mock Data | React + Real APIs | Keep existing high-quality UI |
| **Backend** | None | Supabase | PostgreSQL + real-time + auth |
| **Database** | Mock arrays | PostgreSQL with RLS | Scalable, ACID, security |
| **Auth** | Simulated | Supabase Auth | Real user management + RBAC |
| **Storage** | Static files | Supabase Storage | Scalable image/file management |
| **Payments** | Mock prices | Stripe | Swiss-compliant payment processing |
| **Deployment** | Static | Netlify + Supabase | Edge deployment + global CDN |
| **Compliance** | None | Swiss regulations | GDPR/DSG + VAT + data residency |

---

## 3. Database Schema Design

### 3.1 Core Schema Overview
```sql
-- User Management & Authentication
users (Supabase Auth) ⟷ profiles ⟷ user_roles
                              ↓
-- Business Logic Tables --
customers ⟷ appointments ⟷ services
    ↓           ↓           ↓
customer_loyalty | payments | staff_schedules
customer_segments| invoices | 
    ↓           ↓           ↓
-- E-commerce --
products ⟷ categories ⟷ inventory
    ↓           ↓           ↓
orders ⟷ order_items ⟷ cart_sessions
    ↓           ↓
-- Analytics & Compliance --
financial_reports | audit_logs | gdpr_consents
```

### 3.2 Detailed Table Specifications

#### **👤 User & Profile Management**
```sql
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
  preferred_staff_id UUID REFERENCES staff(id),
  notes TEXT
);

-- user_roles: RBAC system
CREATE TYPE user_role_enum AS ENUM ('owner', 'admin', 'staff', 'customer');
CREATE TYPE gender_enum AS ENUM ('female', 'male', 'child', 'other');
CREATE TYPE loyalty_enum AS ENUM ('neu', 'bronze', 'silber', 'gold', 'diamant');
```

#### **📅 Appointment & Scheduling System**
```sql
-- appointments: Core booking system
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

CREATE TYPE appointment_status_enum AS ENUM (
  'pending', 'confirmed', 'in_progress', 'completed', 
  'cancelled_by_customer', 'cancelled_by_salon', 'no_show'
);

-- waiting_list: Advanced waiting list with preferences
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

CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
```

#### **💼 Staff & Business Management**
```sql
-- staff: Employee management
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

CREATE TYPE staff_position_enum AS ENUM ('owner', 'senior_stylist', 'stylist', 'assistant', 'trainee');

-- staff_schedules: Advanced scheduling
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
```

#### **🛍️ E-commerce & Products**
```sql
-- products: Enhanced product catalog
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

-- categories: Product categorization
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

-- orders: E-commerce order system
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

CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
```

#### **💰 Financial & Analytics**
```sql
-- financial_transactions: Complete financial tracking
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

CREATE TYPE transaction_type_enum AS ENUM (
  'appointment_payment', 'product_sale', 'refund', 'discount', 
  'commission_payment', 'expense', 'adjustment'
);

CREATE TYPE payment_method_enum AS ENUM (
  'cash', 'card', 'twint', 'bank_transfer', 'voucher', 'online'
);

-- analytics_daily: Pre-computed daily analytics
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
```

#### **🔒 Compliance & Security**
```sql
-- gdpr_consents: GDPR/DSG compliance tracking
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

CREATE TYPE consent_type_enum AS ENUM ('gdpr', 'marketing', 'analytics', 'data_processing');
CREATE TYPE consent_method_enum AS ENUM ('website_form', 'email_confirmation', 'phone_verbal', 'in_person');

-- audit_logs: Complete system audit trail
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

CREATE TYPE audit_action_enum AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout');
```

### 3.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
-- ... (all sensitive tables)

-- Customer RLS: Users can only see their own data
CREATE POLICY "customers_own_data" ON appointments
  FOR ALL USING (customer_id = auth.uid());

-- Staff RLS: Staff can see appointments they're assigned to
CREATE POLICY "staff_assigned_appointments" ON appointments
  FOR ALL USING (
    staff_id IN (
      SELECT id FROM staff WHERE profile_id = auth.uid()
    )
  );

-- Admin RLS: Admins see all data
CREATE POLICY "admin_all_access" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

---

## 4. API Endpoints Plan (OpenAPI Specification)

### 4.1 API Structure Overview
```
Base URL: https://your-project.supabase.co/rest/v1/
Authentication: Bearer {supabase-jwt-token}
Content-Type: application/json
```

### 4.2 Authentication & Authorization
```yaml
/api/v1/auth:
  /login:
    POST: User login with email/password
  /register:
    POST: New user registration
  /logout:
    POST: User logout
  /refresh:
    POST: Refresh JWT token
  /reset-password:
    POST: Password reset request
  /verify-email:
    POST: Email verification
  /change-password:
    PUT: Change user password
```

### 4.3 Customer Management
```yaml
/api/v1/customers:
  GET: List customers (admin only, with pagination)
  POST: Create new customer
  
  /{customer_id}:
    GET: Get customer details
    PUT: Update customer
    DELETE: Soft delete customer (GDPR compliance)
    
    /appointments:
      GET: Customer's appointment history
      POST: Book appointment for customer
      
    /purchases:
      GET: Customer's purchase history
      
    /loyalty:
      GET: Customer loyalty status
      PUT: Update loyalty status (admin only)
      
    /gdpr:
      GET: Download customer data (GDPR export)
      DELETE: GDPR data deletion request
```

### 4.4 Appointment Management
```yaml
/api/v1/appointments:
  GET: List appointments (filtered by role/permissions)
  POST: Create new appointment
  
  /{appointment_id}:
    GET: Get appointment details
    PUT: Update appointment
    DELETE: Cancel appointment
    
    /reschedule:
      PUT: Reschedule appointment
      
    /complete:
      PUT: Mark appointment as completed
      
    /notes:
      PUT: Add/update appointment notes

/api/v1/availability:
  GET: Check staff/time availability
  
  /slots:
    GET: Get available time slots
    
  /conflicts:
    GET: Check for scheduling conflicts

/api/v1/waiting-list:
  GET: List waiting list entries
  POST: Add to waiting list
  
  /{entry_id}:
    PUT: Update waiting list preferences
    DELETE: Remove from waiting list
    
    /convert:
      POST: Convert waiting list entry to appointment
      
    /notify:
      POST: Send notification about available slot
```

### 4.5 Staff Management
```yaml
/api/v1/staff:
  GET: List staff members
  POST: Add new staff member (admin only)
  
  /{staff_id}:
    GET: Get staff details
    PUT: Update staff information
    DELETE: Deactivate staff member
    
    /schedule:
      GET: Get staff schedule
      PUT: Update schedule
      
    /appointments:
      GET: Staff's appointments
      
    /performance:
      GET: Staff performance metrics
      
    /commissions:
      GET: Commission calculations
```

### 4.6 Product & E-commerce
```yaml
/api/v1/products:
  GET: List products (with categories, pagination)
  POST: Create product (admin only)
  
  /{product_id}:
    GET: Get product details
    PUT: Update product
    DELETE: Deactivate product
    
    /inventory:
      GET: Check inventory
      PUT: Update stock levels

/api/v1/categories:
  GET: List product categories
  POST: Create category (admin only)
  
  /{category_id}:
    GET: Category with products
    PUT: Update category
    DELETE: Remove category

/api/v1/cart:
  GET: Get user's cart
  POST: Add item to cart
  PUT: Update cart item quantity
  DELETE: Remove item from cart
  
  /checkout:
    POST: Initialize checkout process
    
  /gift-wrap:
    PUT: Enable/disable gift wrapping

/api/v1/orders:
  GET: List orders (filtered by permissions)
  POST: Create order from cart
  
  /{order_id}:
    GET: Get order details
    PUT: Update order status
    
    /payment:
      POST: Process payment
      
    /fulfill:
      PUT: Mark as fulfilled
      
    /cancel:
      PUT: Cancel order
      
    /refund:
      POST: Process refund
```

### 4.7 Financial & Analytics
```yaml
/api/v1/financial:
  /overview:
    GET: Financial dashboard data
    
  /transactions:
    GET: List transactions
    POST: Record transaction
    
  /reports:
    GET: Generate financial reports
    
    /daily:
      GET: Daily financial summary
      
    /monthly:
      GET: Monthly financial reports
      
    /tax-export:
      GET: Swiss tax compliance export (PDF)
      
  /analytics:
    GET: Business analytics
    
    /revenue:
      GET: Revenue analytics
      
    /customers:
      GET: Customer analytics
      
    /services:
      GET: Service performance

/api/v1/invoices:
  GET: List invoices
  POST: Generate invoice
  
  /{invoice_id}:
    GET: Get invoice
    PUT: Update invoice
    DELETE: Void invoice
    
    /pdf:
      GET: Download invoice PDF
      
    /send:
      POST: Email invoice to customer
```

### 4.8 Admin & Settings
```yaml
/api/v1/admin:
  /settings:
    GET: Get business settings
    PUT: Update business settings
    
  /users:
    GET: List all users
    POST: Create user account
    
    /{user_id}:
      PUT: Update user role
      DELETE: Deactivate user
      
  /backup:
    POST: Create data backup
    GET: Download backup
    
  /maintenance:
    PUT: Enable/disable maintenance mode

/api/v1/notifications:
  GET: List notifications
  POST: Send notification
  
  /email:
    POST: Send email notification
    
  /sms:
    POST: Send SMS notification
    
  /preferences:
    GET: Get notification preferences
    PUT: Update preferences
```

### 4.9 Swiss Compliance & GDPR
```yaml
/api/v1/compliance:
  /gdpr:
    GET: Get GDPR compliance status
    
    /consent:
      POST: Record consent
      PUT: Update consent
      DELETE: Withdraw consent
      
    /export:
      POST: Request data export
      GET: Download data export
      
    /deletion:
      POST: Request data deletion
      
  /audit:
    GET: Get audit logs
    
  /vat:
    GET: VAT calculations
    
    /rates:
      GET: Current VAT rates
      PUT: Update VAT rates
```

---

## 5. Implementation Sprint Plan

### Sprint A: Core Infrastructure & Authentication (Weeks 1-4)
**Objective**: Establish foundation with real database and authentication

#### **Backend Setup**
- **Week 1**: Supabase project setup, database schema implementation
  - Create all core tables with RLS policies
  - Set up authentication with role-based access
  - Configure Swiss data residency compliance
  - Implement basic CRUD operations

- **Week 2**: Authentication integration
  - Replace mock auth with Supabase Auth
  - Implement role-based access control (Owner/Admin/Staff/Customer)
  - Add user registration/login flows
  - Set up protected routes and middleware

#### **Core Data Migration**
- **Week 3**: Product catalog migration
  - Migrate `/src/data/products.ts` to database
  - Implement product management APIs
  - Set up image storage in Supabase Storage
  - Create admin product management interface

- **Week 4**: Customer management foundation
  - Replace `mockCustomers` with real customer data
  - Implement customer CRUD operations
  - Add customer profile management
  - Basic loyalty status tracking

#### **Success Criteria**
- ✅ All users can register/login with real accounts
- ✅ Admin can manage products through real database
- ✅ Customer data persists between sessions
- ✅ RLS policies prevent unauthorized data access

### Sprint B: Appointment System & Calendar (Weeks 5-8)
**Objective**: Replace mock appointment system with real booking functionality

#### **Appointment Management**
- **Week 5**: Calendar system replacement
  - Replace `mockAppointments` with real appointment booking
  - Implement staff scheduling system
  - Add appointment CRUD with conflict detection
  - Real-time appointment updates

- **Week 6**: Advanced booking features
  - Waiting list system with automatic notifications
  - Gender-based appointment scheduling optimization
  - Staff assignment based on specialties and availability
  - Appointment reminder system (email/SMS)

#### **Staff Management**
- **Week 7**: Staff module completion
  - Staff profile management
  - Schedule management with time slots
  - Performance tracking and commission calculations
  - Advanced calendar views (day/week/month)

- **Week 8**: Integration & testing
  - Customer appointment dashboard
  - Mobile-responsive booking interface
  - Appointment conflict resolution
  - Performance optimization for calendar views

#### **Success Criteria**
- ✅ Real appointment booking with conflict detection
- ✅ Staff can manage their schedules
- ✅ Customers can book and manage appointments
- ✅ Waiting list automatically converts to bookings

### Sprint C: E-commerce & Payments (Weeks 9-12)
**Objective**: Complete e-commerce integration with Swiss payment processing

#### **E-commerce Foundation**
- **Week 9**: Shopping cart & orders
  - Replace mock cart with persistent shopping cart
  - Implement order management system
  - Product inventory tracking
  - Order fulfillment workflow

- **Week 10**: Payment integration
  - Stripe integration for CHF payments
  - Swiss payment methods (Twint, PostFinance)
  - Invoice generation with Swiss VAT
  - Payment status tracking and webhooks

#### **Business Operations**
- **Week 11**: Financial management
  - Replace mock financial data with real transactions
  - Automated daily/monthly reporting
  - Swiss tax compliance features
  - Revenue analytics and insights

- **Week 12**: Admin dashboard completion
  - Real-time business analytics
  - Financial overview with Swiss compliance
  - Customer insights and segmentation
  - Performance metrics and KPIs

#### **Success Criteria**
- ✅ Customers can purchase products with real payments
- ✅ Complete order fulfillment workflow
- ✅ Swiss VAT compliance and tax reporting
- ✅ Real-time financial analytics for business decisions

### Sprint D: Advanced Features & Production (Weeks 13-16)
**Objective**: Advanced features, compliance, and production deployment

#### **Advanced Features**
- **Week 13**: Marketing & analytics
  - Customer segmentation and targeting
  - Automated marketing campaigns
  - Advanced analytics and insights
  - Customer loyalty automation

- **Week 14**: Swiss compliance & GDPR
  - Complete GDPR/DSG compliance implementation
  - Data export and deletion workflows
  - Audit logging and compliance reporting
  - Swiss data residency verification

#### **Production Readiness**
- **Week 15**: Performance & security
  - Performance optimization and caching
  - Security audit and penetration testing
  - Error handling and monitoring
  - Backup and disaster recovery

- **Week 16**: Deployment & launch
  - Production deployment to Netlify
  - Domain setup and SSL configuration
  - Performance monitoring and alerts
  - User training and documentation

#### **Success Criteria**
- ✅ Full GDPR/DSG compliance with audit trail
- ✅ Production-ready performance and security
- ✅ Complete backup and monitoring systems
- ✅ Successful production launch

---

## 6. Feature Flag Strategy

### 6.1 USE_REAL_API Feature Flag Implementation

#### **Service Layer Abstraction**
```typescript
// src/services/api-service.ts
interface APIService {
  getCustomers(): Promise<Customer[]>;
  getProducts(): Promise<Product[]>;
  getAppointments(): Promise<Appointment[]>;
  // ... all API methods
}

class MockAPIService implements APIService {
  async getCustomers(): Promise<Customer[]> {
    return mockCustomers;
  }
  // ... mock implementations
}

class SupabaseAPIService implements APIService {
  async getCustomers(): Promise<Customer[]> {
    const { data } = await supabase
      .from('customers')
      .select('*');
    return data || [];
  }
  // ... real implementations
}

// Factory pattern for API service
export const createAPIService = (): APIService => {
  const useRealAPI = process.env.VITE_USE_REAL_API === 'true';
  return useRealAPI ? new SupabaseAPIService() : new MockAPIService();
};
```

#### **Environment Configuration**
```bash
# .env.local (Development with mocks)
VITE_USE_REAL_API=false
VITE_SUPABASE_URL=placeholder
VITE_SUPABASE_ANON_KEY=placeholder

# .env.staging (Staging with real API)
VITE_USE_REAL_API=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env.production (Production)
VITE_USE_REAL_API=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6.2 Gradual Migration Strategy

#### **Phase 1: Authentication Only**
```typescript
const useRealAuth = process.env.VITE_USE_REAL_AUTH === 'true';
const authService = useRealAuth ? new SupabaseAuth() : new MockAuth();
```

#### **Phase 2: Core Data (Products, Customers)**
```typescript
const useRealData = process.env.VITE_USE_REAL_DATA === 'true';
const dataService = useRealData ? new SupabaseData() : new MockData();
```

#### **Phase 3: Full System**
```typescript
const useRealAPI = process.env.VITE_USE_REAL_API === 'true';
const apiService = useRealAPI ? new SupabaseAPI() : new MockAPI();
```

### 6.3 Rollback Capabilities

#### **Instant Rollback**
```bash
# Emergency rollback to mock data
echo "VITE_USE_REAL_API=false" > .env.local
npm run build && npm run deploy
```

#### **Component-Level Flags**
```typescript
// Individual component flags for granular control
const featureFlags = {
  realCustomers: process.env.VITE_REAL_CUSTOMERS === 'true',
  realAppointments: process.env.VITE_REAL_APPOINTMENTS === 'true',
  realPayments: process.env.VITE_REAL_PAYMENTS === 'true',
  realAnalytics: process.env.VITE_REAL_ANALYTICS === 'true'
};
```

---

## 7. Quality & Compliance Requirements

### 7.1 Code Quality Standards

#### **TypeScript Configuration**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### **ESLint Configuration**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

#### **Code Coverage Requirements**
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: Critical paths (auth, payments, bookings)
- **E2E Tests**: Complete user workflows

### 7.2 Swiss Compliance Requirements

#### **Legal Framework Compliance**
- **DSG (Datenschutzgesetz)**: Swiss data protection law
- **GDPR**: European data protection (applicable to EU customers)
- **MWSTG**: Swiss VAT law compliance
- **OR (Obligationenrecht)**: Swiss commercial law

#### **Data Residency**
```typescript
// Supabase configuration for Swiss data residency
const supabaseConfig = {
  region: 'eu-central-1', // Frankfurt (closest to Switzerland)
  dataResidency: 'eu',
  encryptionAtRest: true,
  encryptionInTransit: true
};
```

#### **VAT Compliance**
```typescript
// Swiss VAT rates (as of 2024)
const swissVAT = {
  standard: 7.7, // Standard rate
  reduced: 2.5,  // Food, books, etc.
  special: 3.7   // Accommodation
};

// Services are subject to 7.7% VAT
const calculateVAT = (amount: number): number => {
  return amount * (swissVAT.standard / 100);
};
```

#### **Data Retention Policy**
```sql
-- Automatic data deletion after retention period
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS trigger AS $$
BEGIN
  -- Delete personal data after retention period expires
  DELETE FROM audit_logs 
  WHERE retention_until < CURRENT_DATE;
  
  -- Anonymize customer data after legal requirement
  UPDATE profiles 
  SET 
    email = 'deleted@' || id::text,
    phone = NULL,
    full_name = 'Deleted User'
  WHERE 
    data_retention_until < CURRENT_DATE
    AND role = 'customer';
    
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Accessibility Standards

#### **WCAG 2.1 AA Compliance**
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels
- **Focus Management**: Visible focus indicators

#### **Implementation**
```typescript
// Accessibility-first component design
const Button = ({ children, ...props }: ButtonProps) => (
  <button
    {...props}
    className={cn(
      "focus:ring-2 focus:ring-offset-2 focus:ring-primary",
      "focus:outline-none",
      props.className
    )}
    aria-describedby={props.description ? `${props.id}-desc` : undefined}
  >
    {children}
  </button>
);
```

### 7.4 Security Requirements

#### **Authentication Security**
- **Multi-Factor Authentication**: Optional 2FA for admin accounts
- **Password Policy**: Minimum 12 characters, complexity requirements
- **Session Management**: Secure JWT tokens with proper expiration
- **Account Lockout**: Protection against brute force attacks

#### **Data Protection**
```typescript
// Encryption for sensitive data
const encryptSensitiveData = (data: string): string => {
  // Use Supabase vault for encryption keys
  return encrypt(data, process.env.ENCRYPTION_KEY);
};

// PII data masking for logs
const maskPII = (data: any): any => {
  return {
    ...data,
    email: data.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
    phone: data.phone?.replace(/(.{3}).*(.{2})/, '$1***$2')
  };
};
```

### 7.5 Performance Requirements

#### **Performance Targets**
- **Initial Load**: < 2 seconds (3G connection)
- **Time to Interactive**: < 3 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **First Input Delay**: < 100ms

#### **Optimization Strategies**
```typescript
// Lazy loading for heavy components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const CustomerDashboard = lazy(() => import('./CustomerDashboard'));

// Image optimization
const OptimizedImage = ({ src, alt, ...props }: ImageProps) => (
  <img
    {...props}
    src={`${src}?width=${props.width}&quality=80&format=webp`}
    alt={alt}
    loading="lazy"
    decoding="async"
  />
);

// Database query optimization
const getCustomersWithPagination = async (page: number, limit: number) => {
  return supabase
    .from('customers')
    .select('id, name, email, total_spent')
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
};
```

### 7.6 Monitoring & Error Handling

#### **Error Monitoring**
```typescript
// Comprehensive error tracking
class ErrorTracker {
  static trackError(error: Error, context: string): void {
    console.error(`[${context}]`, error);
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      sendToSentry(error, { context });
    }
    
    // Log to database for audit
    supabase.from('error_logs').insert({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### **Health Checks**
```typescript
// API health monitoring
export const healthCheck = async (): Promise<HealthStatus> => {
  const checks = await Promise.allSettled([
    supabase.from('health_check').select('count').single(),
    stripeClient.customers.list({ limit: 1 }),
    // ... other service checks
  ]);
  
  return {
    database: checks[0].status === 'fulfilled',
    payments: checks[1].status === 'fulfilled',
    overall: checks.every(check => check.status === 'fulfilled')
  };
};
```

---

## 8. Risk Assessment & Mitigation

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Data Migration Issues** | Medium | High | Comprehensive testing, rollback plan, gradual migration |
| **Performance Degradation** | Low | Medium | Performance monitoring, caching strategy, CDN |
| **Security Vulnerabilities** | Low | High | Security audit, penetration testing, regular updates |
| **Third-party API Failures** | Medium | Medium | Circuit breakers, fallback mechanisms, monitoring |

### 8.2 Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **User Adoption Issues** | Low | Medium | User training, gradual rollout, feedback collection |
| **Compliance Violations** | Low | High | Legal review, compliance automation, audit trail |
| **Downtime During Migration** | Medium | Medium | Blue-green deployment, maintenance windows |
| **Budget Overruns** | Medium | Low | Fixed-scope sprints, regular monitoring |

### 8.3 Contingency Plans

#### **Emergency Rollback Procedure**
1. Set `VITE_USE_REAL_API=false`
2. Deploy previous stable version
3. Communicate with users about temporary service interruption
4. Investigate and fix issues in staging environment

#### **Data Recovery Plan**
1. Daily automated backups of Supabase database
2. Point-in-time recovery capabilities
3. Backup verification testing monthly
4. Documented recovery procedures

---

## 9. Success Metrics & KPIs

### 9.1 Technical Metrics
- **System Uptime**: 99.9% availability
- **Page Load Speed**: < 2 seconds average
- **Database Response Time**: < 100ms for 95% of queries
- **Error Rate**: < 0.1% of all requests

### 9.2 Business Metrics
- **Customer Satisfaction**: > 4.5/5 rating
- **Booking Conversion Rate**: > 15% improvement
- **Administrative Efficiency**: 50% reduction in manual tasks
- **Revenue Tracking Accuracy**: 100% transaction reconciliation

### 9.3 Compliance Metrics
- **GDPR Compliance**: 100% data requests processed within 30 days
- **Security Incidents**: 0 data breaches
- **Audit Compliance**: Pass all regulatory audits
- **Data Retention**: 100% automated compliance with retention policies

---

## 10. Conclusion & Next Steps

This comprehensive plan provides a clear roadmap for transforming the Schnittwerk hair salon application from a mock data prototype to a production-ready business management system. The transformation will be executed through four carefully planned sprints, each building upon the previous work while maintaining the high-quality user experience already established.

### Immediate Next Steps
1. **Environment Setup** (Week 1): Set up Supabase project and development environment
2. **Team Briefing** (Week 1): Review plan with development team and stakeholders
3. **Sprint A Kickoff** (Week 1): Begin with authentication and core infrastructure
4. **Stakeholder Approval** (Week 1): Confirm budget, timeline, and feature scope

### Long-term Benefits
- **Scalable Architecture**: Support for business growth and expansion
- **Swiss Compliance**: Full legal compliance for operating in Switzerland
- **Operational Efficiency**: Automated processes reducing manual workload
- **Customer Experience**: Enhanced booking and service delivery
- **Business Intelligence**: Real-time insights for data-driven decisions

The implementation will maintain the existing high-quality frontend while building a robust, compliant, and scalable backend that positions the business for long-term success in the Swiss market.