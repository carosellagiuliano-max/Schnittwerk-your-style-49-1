import { OrderService, OrderItem } from './orderService';

export { paymentService } from './paymentService';
export { OrderService } from './orderService';
export { invoiceService } from './invoiceService';
export { voucherService } from './voucherService';

// Re-export all types for convenience
export type {
  PaymentIntentRequest,
  PaymentIntentResponse,
  PaymentConfirmationRequest,
  PaymentConfirmationResponse,
  RefundRequest,
  RefundResponse,
} from './paymentService';

export type {
  OrderItem,
  Order,
  OrderSummary,
} from './orderService';

export type {
  InvoiceRequest,
  InvoiceResponse,
  GetInvoiceRequest,
  GetInvoiceResponse,
  SendInvoiceRequest,
  SendInvoiceResponse,
} from './invoiceService';

export type {
  VoucherRequest,
  VoucherResponse,
  VoucherDetails,
} from './voucherService';

// Service aggregator for common operations
export class PaymentOrchestrator {
  /**
   * Complete payment flow from calculation to confirmation
   */
  static async completePaymentFlow(
    items: OrderItem[],
    customerEmail: string,
    customerName: string,
    voucherCode?: string,
    customerAddress?: {
      street: string;
      city: string;
      zipCode: string;
    }
  ) {
    try {
      // 1. Calculate order total
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatAmount = OrderService.calculateVAT(subtotal);
      const totalAmount = OrderService.getTotalWithVAT(subtotal);

      // 2. Create payment intent
      const paymentIntent = await import('./paymentService').then(m =>
        m.paymentService.createPaymentIntent({
          orderId: `temp_${Date.now()}`,
          amount: totalAmount,
          currency: 'chf',
          customerEmail,
          metadata: {
            orderType: 'hair_salon_service',
            customerName,
            voucherCode: voucherCode || '',
          },
        })
      );

      // 3. Return combined response
      return {
        success: true,
        paymentIntent,
        orderCalculation: {
          subtotal,
          vatAmount,
          totalAmount,
          items,
        },
        nextStep: 'confirm_payment',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment flow failed',
      };
    }
  }

  /**
   * Process order after successful payment
   */
  static async processSuccessfulOrder(
    orderId: string,
    paymentIntentId: string,
    customerEmail: string,
    customerName: string,
    customerAddress?: {
      street: string;
      city: string;
      zipCode: string;
    }
  ) {
    try {
      // 1. Confirm payment
      const paymentConfirmation = await import('./paymentService').then(m =>
        m.paymentService.confirmPayment({
          paymentIntentId,
          orderId,
        })
      );

      // 2. Generate and send invoice
      const invoiceResult = await import('./invoiceService').then(m =>
        m.invoiceService.generateAndSendInvoice(
          orderId,
          customerEmail,
          customerName,
          customerAddress
        )
      );

      // 3. Complete order processing - update order status to processing
      const orderCompletion = await OrderService.updateOrderStatus(orderId, 'processing');

      return {
        success: true,
        paymentConfirmation,
        invoice: invoiceResult.invoice,
        order: orderCompletion,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order processing failed',
      };
    }
  }

  /**
   * Handle refund flow
   */
  static async processRefund(
    orderId: string,
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ) {
    try {
      const refund = await import('./paymentService').then(m =>
        m.paymentService.processRefund({
          orderId,
          paymentIntentId,
          amount,
          reason,
        })
      );

      return {
        success: true,
        refund,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }
}