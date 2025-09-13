# Payment Service Layer Documentation

This directory contains the complete frontend service layer for the Schnittwerk hair salon payment system with Swiss compliance.

## Services Overview

### 1. PaymentService (`paymentService.ts`)
Handles Stripe payment processing including:
- Payment intent creation
- Payment confirmation
- Refund processing
- Stripe Elements integration

### 2. OrderService (`orderService.ts`)
Manages order lifecycle:
- Order calculation with Swiss VAT
- Order processing (complete, cancel, schedule)
- Order status management

### 3. InvoiceService (`invoiceService.ts`)
Handles Swiss-compliant invoice generation:
- PDF invoice creation
- Email delivery
- Invoice retrieval

### 4. VoucherService (`voucherService.ts`)
Manages voucher/discount codes:
- Voucher validation
- Discount calculation
- Voucher formatting

### 5. PaymentOrchestrator (`index.ts`)
High-level orchestration for complete payment flows.

## Quick Start

### Basic Payment Flow

```typescript
import { PaymentOrchestrator, voucherService } from '@/services';

// 1. Calculate order with voucher
const orderCalculation = await PaymentOrchestrator.completePaymentFlow(
  [
    { serviceId: 'haircut', quantity: 1 },
    { productId: 'shampoo', quantity: 2 }
  ],
  'customer@example.com',
  'John Doe',
  'SUMMER2024'
);

if (orderCalculation.success) {
  console.log('Order calculated:', orderCalculation.orderCalculation);
  console.log('Payment intent created:', orderCalculation.paymentIntent);
}

// 2. After successful payment, process order
const orderResult = await PaymentOrchestrator.processSuccessfulOrder(
  'order_123',
  'pi_1234567890',
  'customer@example.com',
  'John Doe',
  {
    street: 'Bahnhofstrasse 123',
    city: 'Zürich',
    zipCode: '8001'
  }
);
```

### Individual Service Usage

#### Payment Service
```typescript
import { paymentService } from '@/services';

// Create payment intent
const paymentIntent = await paymentService.createPaymentIntent({
  orderId: 'order_123',
  amount: 15000, // CHF 150.00 in cents
  currency: 'chf',
  customerEmail: 'customer@example.com',
  metadata: { service: 'haircut' }
});

// Confirm payment
await paymentService.confirmPayment({
  paymentIntentId: 'pi_1234567890',
  orderId: 'order_123'
});

// Process refund
await paymentService.processRefund({
  orderId: 'order_123',
  amount: 5000, // CHF 50.00 refund
  reason: 'Customer cancellation'
});
```

#### Order Service
```typescript
import { orderService } from '@/services';

// Calculate order total
const calculation = await orderService.calculateOrder({
  items: [
    { serviceId: 'haircut', quantity: 1 },
    { productId: 'shampoo', quantity: 2 }
  ],
  voucherCode: 'SUMMER2024'
});

// Process order actions
await orderService.completeOrder('order_123');
await orderService.cancelOrder('order_123', 'Customer request');
await orderService.scheduleOrder(
  'order_123',
  '2024-09-15',
  '14:00',
  'stylist_123',
  'Special instructions'
);
```

#### Invoice Service
```typescript
import { invoiceService } from '@/services';

// Generate invoice
const invoice = await invoiceService.generateInvoice({
  orderId: 'order_123',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe',
  customerAddress: {
    street: 'Bahnhofstrasse 123',
    city: 'Zürich',
    zipCode: '8001'
  }
});

// Send invoice via email
await invoiceService.sendInvoice({
  invoiceId: 'inv_123',
  customerEmail: 'customer@example.com',
  customerName: 'John Doe'
});

// Generate and send in one call
const result = await invoiceService.generateAndSendInvoice(
  'order_123',
  'customer@example.com',
  'John Doe'
);
```

#### Voucher Service
```typescript
import { voucherService } from '@/services';

// Validate voucher
const voucher = await voucherService.validateVoucher('SUMMER2024', 15000);
if (voucher.valid) {
  console.log(`Discount: ${voucherService.formatDiscount(voucher)}`);
  console.log(`New total: CHF ${voucherService.calculateDiscountedPrice(150, voucher)}`);
}
```

## Swiss Compliance Features

### VAT Calculation
- Automatic 7.7% VAT calculation
- Swiss rounding rules (0.05 CHF steps)
- Proper VAT breakdown in invoices

### Currency Handling
- All amounts in CHF (Swiss Francs)
- Proper formatting for Swiss locale
- Rappen (cents) handling

### Invoice Requirements
- Swiss business format
- VAT number inclusion
- Proper Swiss address formatting
- 30-day payment terms
- Bank details for Swiss transfers

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const result = await paymentService.createPaymentIntent(request);
} catch (error) {
  if (error instanceof Error) {
    console.error('Payment error:', error.message);
    // Handle specific error types
  }
}
```

## Environment Setup

Ensure these environment variables are set:

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

## TypeScript Support

Full TypeScript support with proper interfaces for all requests and responses. Import types as needed:

```typescript
import type { 
  PaymentIntentRequest, 
  CalculateOrderRequest,
  InvoiceRequest 
} from '@/services';