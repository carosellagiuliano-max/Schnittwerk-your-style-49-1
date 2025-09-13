import { API_CONFIG } from '@/config/api';
import { loadStripe } from '@stripe/stripe-js';
import { stripePromise } from '@/config/stripe';

export interface PaymentIntentRequest {
  orderId: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmationRequest {
  paymentIntentId: string;
  orderId: string;
}

export interface PaymentConfirmationResponse {
  status: string;
  amount: number;
  currency: string;
  message: string;
  nextAction?: any;
}

export interface RefundRequest {
  orderId: string;
  paymentIntentId?: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  amount: number;
  status: string;
  orderId: string;
}

class PaymentService {
  private async fetchApi(endpoint: string, options: RequestInit) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.data;
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    return this.fetchApi(API_CONFIG.endpoints.createPaymentIntent, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async confirmPayment(request: PaymentConfirmationRequest): Promise<PaymentConfirmationResponse> {
    return this.fetchApi(API_CONFIG.endpoints.confirmPayment, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    return this.fetchApi(API_CONFIG.endpoints.processRefund, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async initializeStripe() {
    return stripePromise;
  }

  async handlePayment(orderId: string, elements: any, stripe: any) {
    try {
      // Create payment intent
      const { clientSecret } = await this.createPaymentIntent({ orderId });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment on backend
      await this.confirmPayment({
        paymentIntentId: paymentIntent.id,
        orderId,
      });

      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Payment failed:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();