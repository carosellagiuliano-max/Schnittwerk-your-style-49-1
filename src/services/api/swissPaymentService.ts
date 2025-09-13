/**
 * Swiss Payment Service - Sprint C Week 10
 * Stripe integration with Swiss payment methods and CHF compliance
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { stripePromise, STRIPE_CONFIG } from '@/config/stripe';
import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { SwissVATService } from './ecommerceService';

export interface SwissPaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  payment_method_types: string[];
  metadata: Record<string, string>;
  created: number;
  description?: string;
}

export interface SwissPaymentMethod {
  id: string;
  type: 'card' | 'twint' | 'postfinance' | 'sofort' | 'bancontact';
  display_name: string;
  description: string;
  is_active: boolean;
  supports_chf: boolean;
  processing_fee_percentage: number;
  icon_url: string;
}

export interface PaymentRequest {
  order_id: string;
  amount: number; // Amount in CHF cents (Rappen)
  currency: 'chf';
  customer_id?: string;
  customer_email?: string;
  payment_method_types?: string[];
  metadata?: Record<string, string>;
  description?: string;
  automatic_payment_methods?: boolean;
}

export interface PaymentConfirmation {
  payment_intent_id: string;
  order_id: string;
  status: 'succeeded' | 'requires_action' | 'failed';
  payment_method?: {
    id: string;
    type: string;
    last4?: string;
    brand?: string;
  };
  receipt_url?: string;
  failure_reason?: string;
}

export interface SwissInvoice {
  id: string;
  order_id: string;
  invoice_number: string;
  customer_name: string;
  customer_address: SwissAddress;
  business_info: SwissBusinessInfo;
  line_items: InvoiceLineItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  currency: 'CHF';
  payment_terms: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SwissAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  postal_code: string;
  city: string;
  canton: string;
  country: 'CH';
  vat_number?: string;
}

export interface SwissBusinessInfo {
  name: string;
  address: SwissAddress;
  vat_number: string;
  uid_number?: string; // Swiss enterprise identifier
  contact_email: string;
  contact_phone: string;
  bank_details?: {
    iban: string;
    bic?: string;
    bank_name: string;
  };
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
}

/**
 * Swiss Payment Service with Stripe integration
 */
export class SwissPaymentService {
  private static stripe: Stripe | null = null;

  /**
   * Initialize Stripe instance
   */
  static async initializeStripe(): Promise<Stripe> {
    if (this.stripe) {
      return this.stripe;
    }

    this.stripe = await stripePromise;
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    return this.stripe;
  }

  /**
   * Get available payment methods for Swiss market
   */
  static getSwissPaymentMethods(): SwissPaymentMethod[] {
    return [
      {
        id: 'card',
        type: 'card',
        display_name: 'Kreditkarte',
        description: 'Visa, Mastercard, American Express',
        is_active: true,
        supports_chf: true,
        processing_fee_percentage: 2.9,
        icon_url: '/icons/payment/card.svg',
      },
      {
        id: 'twint',
        type: 'twint',
        display_name: 'TWINT',
        description: 'Schweizer Mobile Payment',
        is_active: true,
        supports_chf: true,
        processing_fee_percentage: 1.5,
        icon_url: '/icons/payment/twint.svg',
      },
      {
        id: 'postfinance',
        type: 'postfinance',
        display_name: 'PostFinance',
        description: 'E-Finance & PostFinance Card',
        is_active: true,
        supports_chf: true,
        processing_fee_percentage: 1.8,
        icon_url: '/icons/payment/postfinance.svg',
      },
      {
        id: 'sofort',
        type: 'sofort',
        display_name: 'Sofort',
        description: 'Online Banking',
        is_active: true,
        supports_chf: true,
        processing_fee_percentage: 1.4,
        icon_url: '/icons/payment/sofort.svg',
      },
    ];
  }

  /**
   * Create payment intent with Swiss compliance
   */
  static async createPaymentIntent(request: PaymentRequest): Promise<SwissPaymentIntent> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_PAYMENTS) {
        return this.createMockPaymentIntent(request);
      }

      // Validate CHF amount (Swiss rounding)
      const roundedAmount = this.roundSwissAmount(request.amount);
      
      const stripe = await this.initializeStripe();
      
      const paymentIntentParams = {
        amount: roundedAmount,
        currency: 'chf',
        payment_method_types: request.payment_method_types || ['card'],
        metadata: {
          order_id: request.order_id,
          customer_id: request.customer_id || '',
          ...request.metadata,
        },
        description: request.description || `Schnittwerk Order ${request.order_id}`,
        receipt_email: request.customer_email,
        automatic_payment_methods: {
          enabled: request.automatic_payment_methods !== false,
          allow_redirects: 'always',
        },
      };

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Store payment intent in database
      await this.storePaymentIntent(paymentIntent, request);

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method_types: paymentIntent.payment_method_types,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
        description: paymentIntent.description || undefined,
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Fehler beim Erstellen der Zahlung');
    }
  }

  /**
   * Confirm payment with Swiss payment methods
   */
  static async confirmPayment(
    clientSecret: string,
    elements: StripeElements,
    returnUrl: string
  ): Promise<PaymentConfirmation> {
    try {
      const stripe = await this.initializeStripe();

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Update payment status in database
      await this.updatePaymentStatus(paymentIntent.id, paymentIntent.status);

      return {
        payment_intent_id: paymentIntent.id,
        order_id: paymentIntent.metadata.order_id,
        status: paymentIntent.status as PaymentConfirmation['status'],
        payment_method: paymentIntent.payment_method ? {
          id: paymentIntent.payment_method.id,
          type: paymentIntent.payment_method.type,
          // @ts-ignore - Stripe types are complex
          last4: paymentIntent.payment_method.card?.last4,
          brand: paymentIntent.payment_method.card?.brand,
        } : undefined,
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url || undefined,
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw new Error('Zahlung fehlgeschlagen: ' + (error as Error).message);
    }
  }

  /**
   * Handle TWINT payment (Switzerland-specific)
   */
  static async processTwintPayment(
    amount: number,
    orderId: string,
    customerPhone?: string
  ): Promise<SwissPaymentIntent> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_PAYMENTS) {
        return this.createMockPaymentIntent({
          order_id: orderId,
          amount,
          currency: 'chf',
          payment_method_types: ['twint'],
        });
      }

      const stripe = await this.initializeStripe();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: this.roundSwissAmount(amount),
        currency: 'chf',
        payment_method_types: ['twint'],
        metadata: {
          order_id: orderId,
          payment_type: 'twint',
          customer_phone: customerPhone || '',
        },
        description: `TWINT Payment - Order ${orderId}`,
      });

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method_types: paymentIntent.payment_method_types,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      };
    } catch (error) {
      console.error('TWINT payment failed:', error);
      throw new Error('TWINT Zahlung fehlgeschlagen');
    }
  }

  /**
   * Process refund with Swiss compliance
   */
  static async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ id: string; amount: number; status: string }> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_PAYMENTS) {
        return {
          id: `mock_refund_${Date.now()}`,
          amount: amount || 0,
          status: 'succeeded',
        };
      }

      const stripe = await this.initializeStripe();
      
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? this.roundSwissAmount(amount) : undefined,
        reason: reason as any || 'requested_by_customer',
        metadata: {
          refund_reason: reason || 'Customer request',
          processed_at: new Date().toISOString(),
        },
      });

      // Update refund status in database
      await this.recordRefund(refund);

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      console.error('Refund failed:', error);
      throw new Error('Rückerstattung fehlgeschlagen');
    }
  }

  /**
   * Generate Swiss-compliant invoice
   */
  static async generateSwissInvoice(
    orderId: string,
    customerInfo: SwissAddress,
    businessInfo: SwissBusinessInfo
  ): Promise<SwissInvoice> {
    try {
      // Get order details
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error || !order) {
        throw new Error('Order not found');
      }

      const invoiceNumber = this.generateInvoiceNumber();
      
      const lineItems: InvoiceLineItem[] = order.items.map((item: any) => {
        const vatAmount = SwissVATService.calculateVAT(item.product_price * item.quantity).vat_amount;
        return {
          description: `${item.product_name} (${item.quantity}x)`,
          quantity: item.quantity,
          unit_price: item.product_price,
          vat_rate: 0.077,
          vat_amount: vatAmount,
          total_amount: item.product_price * item.quantity + vatAmount,
        };
      });

      const invoice: SwissInvoice = {
        id: crypto.randomUUID(),
        order_id: orderId,
        invoice_number: invoiceNumber,
        customer_name: `${customerInfo.first_name} ${customerInfo.last_name}`,
        customer_address: customerInfo,
        business_info: businessInfo,
        line_items: lineItems,
        subtotal: order.subtotal,
        vat_amount: order.tax_amount,
        total_amount: order.total_amount,
        currency: 'CHF',
        payment_terms: 'Zahlbar innerhalb 30 Tagen',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Store invoice in database
      await this.storeInvoice(invoice);

      return invoice;
    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw new Error('Rechnung konnte nicht erstellt werden');
    }
  }

  /**
   * Handle Stripe webhooks
   */
  static async handleWebhook(event: PaymentWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics for Swiss compliance reporting
   */
  static async getPaymentStatistics(dateFrom: string, dateTo: string) {
    try {
      const { data, error } = await supabase
        .from('payment_intents')
        .select('*')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .eq('currency', 'chf');

      if (error) {
        throw error;
      }

      const statistics = {
        total_transactions: data.length,
        total_amount: data.reduce((sum, payment) => sum + payment.amount, 0),
        successful_payments: data.filter(p => p.status === 'succeeded').length,
        failed_payments: data.filter(p => p.status === 'failed').length,
        refunded_amount: data.reduce((sum, payment) => sum + (payment.refunded_amount || 0), 0),
        payment_methods: this.groupByPaymentMethod(data),
        vat_collected: data.reduce((sum, payment) => sum + (payment.vat_amount || 0), 0),
      };

      return statistics;
    } catch (error) {
      console.error('Failed to get payment statistics:', error);
      throw error;
    }
  }

  // Private helper methods

  private static roundSwissAmount(amount: number): number {
    // Swiss rounding to nearest 0.05 CHF (5 Rappen)
    return Math.round(amount / 5) * 5;
  }

  private static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }

  private static async storePaymentIntent(paymentIntent: any, request: PaymentRequest): Promise<void> {
    await supabase
      .from('payment_intents')
      .insert({
        stripe_payment_intent_id: paymentIntent.id,
        order_id: request.order_id,
        customer_id: request.customer_id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        payment_method_types: paymentIntent.payment_method_types,
        metadata: paymentIntent.metadata,
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      });
  }

  private static async updatePaymentStatus(paymentIntentId: string, status: string): Promise<void> {
    await supabase
      .from('payment_intents')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);
  }

  private static async recordRefund(refund: any): Promise<void> {
    await supabase
      .from('refunds')
      .insert({
        stripe_refund_id: refund.id,
        payment_intent_id: refund.payment_intent,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        metadata: refund.metadata,
        created_at: new Date(refund.created * 1000).toISOString(),
      });
  }

  private static async storeInvoice(invoice: SwissInvoice): Promise<void> {
    await supabase
      .from('invoices')
      .insert({
        id: invoice.id,
        order_id: invoice.order_id,
        invoice_number: invoice.invoice_number,
        customer_data: {
          name: invoice.customer_name,
          address: invoice.customer_address,
        },
        business_data: invoice.business_info,
        line_items: invoice.line_items,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vat_amount,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        payment_terms: invoice.payment_terms,
        due_date: invoice.due_date,
        status: invoice.status,
      });
  }

  private static async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    // Update order status to paid
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.metadata.order_id);
  }

  private static async handlePaymentFailed(paymentIntent: any): Promise<void> {
    // Update order status to payment failed
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.metadata.order_id);
  }

  private static async handleChargeDispute(charge: any): Promise<void> {
    // Handle charge disputes
    console.log('Charge dispute created:', charge.id);
    // Implement dispute handling logic
  }

  private static groupByPaymentMethod(payments: any[]): Record<string, number> {
    return payments.reduce((acc, payment) => {
      const method = payment.payment_method_types[0] || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
  }

  // Mock implementations for development
  private static createMockPaymentIntent(request: PaymentRequest): SwissPaymentIntent {
    return {
      id: `mock_pi_${Date.now()}`,
      client_secret: `mock_pi_${Date.now()}_secret_test`,
      amount: request.amount,
      currency: 'chf',
      status: 'requires_payment_method',
      payment_method_types: request.payment_method_types || ['card'],
      metadata: {
        order_id: request.order_id,
        ...request.metadata,
      },
      created: Math.floor(Date.now() / 1000),
      description: request.description,
    };
  }
}

export default SwissPaymentService;