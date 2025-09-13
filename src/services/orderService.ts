import { supabase } from '@/config/api';

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  payment_intent_id: string;
  payment_status: 'pending' | 'deposit_paid' | 'paid' | 'refunded';
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: string;
  customer_id?: string;
  total_amount: number;
  status: Order['status'];
  created_at: string;
  item_count: number;
}

export class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
      }

      return data as Order;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Order not found
        }
        console.error('Error fetching order:', error);
        throw new Error('Failed to fetch order');
      }

      return data as Order;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  }

  /**
   * Get orders by customer ID
   */
  static async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw new Error('Failed to fetch customer orders');
      }

      return data as Order[];
    } catch (error) {
      console.error('Customer orders fetch error:', error);
      throw error;
    }
  }

  /**
   * Get all orders (admin function)
   */
  static async getAllOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all orders:', error);
        throw new Error('Failed to fetch orders');
      }

      return data as Order[];
    } catch (error) {
      console.error('All orders fetch error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Order status update error:', error);
      throw error;
    }
  }

  /**
   * Get order summary for customer
   */
  static async getOrderSummary(customerId: string): Promise<OrderSummary[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          total_amount,
          status,
          created_at,
          items
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order summary:', error);
        throw new Error('Failed to fetch order summary');
      }

      return data.map(order => ({
        id: order.id,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        item_count: order.items?.length || 0,
      })) as OrderSummary[];
    } catch (error) {
      console.error('Order summary fetch error:', error);
      throw error;
    }
  }

  /**
   * Calculate Swiss VAT (7.7%)
   */
  static calculateVAT(amount: number): number {
    return Math.round(amount * 0.077 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get total with VAT
   */
  static getTotalWithVAT(amount: number): number {
    return Math.round(amount * 1.077 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Format currency for Swiss Francs
   */
  static formatSwissCurrency(amount: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Validate order data
   */
  static validateOrderData(orderData: Partial<Order>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Bestellung muss mindestens ein Produkt enthalten');
    }

    if (!orderData.payment_intent_id) {
      errors.push('Payment Intent ID ist erforderlich');
    }

    if (orderData.subtotal === undefined || orderData.subtotal < 0) {
      errors.push('Zwischensumme muss gültig sein');
    }

    if (orderData.total_amount === undefined || orderData.total_amount < 0) {
      errors.push('Gesamtbetrag muss gültig sein');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default OrderService;