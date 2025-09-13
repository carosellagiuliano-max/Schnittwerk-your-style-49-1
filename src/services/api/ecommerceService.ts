/**
 * E-commerce Service Layer - Sprint C Week 9 Implementation
 * Comprehensive shopping cart and order management system
 * Swiss VAT compliance and inventory tracking
 */

import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export interface PersistentCart {
  id: string;
  customer_id?: string;
  session_id?: string;
  items: CartItemPersistent[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  is_gift_wrapped: boolean;
  gift_wrap_gender?: 'men' | 'women';
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface CartItemPersistent {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  category: string;
  image_url: string;
  is_gift_wrapped?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderManagement {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: OrderItemDetail[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'deposit_paid' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_intent_id?: string;
  is_gift_wrapped: boolean;
  gift_wrap_gender?: 'men' | 'women';
  special_instructions?: string;
  shipping_address?: ShippingAddress;
  billing_address?: BillingAddress;
  fulfillment_status: 'pending' | 'prepared' | 'ready_for_pickup' | 'shipped' | 'delivered';
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface OrderItemDetail {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  category: string;
  image_url: string;
  fulfillment_status: 'pending' | 'prepared' | 'ready' | 'shipped' | 'delivered';
  created_at: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country: string;
  canton?: string; // Swiss canton
}

export interface BillingAddress extends ShippingAddress {
  vat_number?: string; // Swiss business VAT number
}

export interface InventoryItem {
  id: string;
  product_id: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_backorder_allowed: boolean;
  supplier_info?: string;
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderFulfillment {
  id: string;
  order_id: string;
  status: 'pending' | 'prepared' | 'ready_for_pickup' | 'shipped' | 'delivered';
  prepared_by?: string;
  prepared_at?: string;
  tracking_number?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SwissVATCalculation {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
}

/**
 * Persistent Shopping Cart Service
 */
export class PersistentCartService {
  private static CART_EXPIRY_DAYS = 30;

  /**
   * Get or create a persistent cart for customer or session
   */
  static async getCart(customerId?: string, sessionId?: string): Promise<PersistentCart | null> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.getMockCart(customerId, sessionId);
      }

      const { data, error } = await supabase
        .from('persistent_carts')
        .select(`
          *,
          items:cart_items(*)
        `)
        .eq(customerId ? 'customer_id' : 'session_id', customerId || sessionId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching cart:', error);
        throw new Error('Failed to fetch cart');
      }

      return data as PersistentCart || null;
    } catch (error) {
      console.error('Cart fetch error:', error);
      throw error;
    }
  }

  /**
   * Create a new persistent cart
   */
  static async createCart(customerId?: string, sessionId?: string): Promise<PersistentCart> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.createMockCart(customerId, sessionId);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CART_EXPIRY_DAYS);

      const { data, error } = await supabase
        .from('persistent_carts')
        .insert({
          customer_id: customerId,
          session_id: sessionId,
          items: [],
          subtotal: 0,
          vat_amount: 0,
          total_amount: 0,
          is_gift_wrapped: false,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating cart:', error);
        throw new Error('Failed to create cart');
      }

      return data as PersistentCart;
    } catch (error) {
      console.error('Cart creation error:', error);
      throw error;
    }
  }

  /**
   * Add item to persistent cart with inventory check
   */
  static async addToCart(
    cartId: string,
    productId: string,
    quantity: number = 1
  ): Promise<PersistentCart> {
    try {
      // Check inventory availability
      const inventory = await InventoryService.getProductInventory(productId);
      if (!inventory || inventory.available_quantity < quantity) {
        throw new Error('Insufficient inventory for requested quantity');
      }

      // Reserve inventory
      await InventoryService.reserveInventory(productId, quantity);

      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.addToMockCart(cartId, productId, quantity);
      }

      // Get product details
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Add to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          product_name: product.name,
          product_price: product.price,
          quantity,
          category: product.category_id,
          image_url: product.image_url || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to cart:', error);
        throw new Error('Failed to add item to cart');
      }

      // Update cart totals
      return this.updateCartTotals(cartId);
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  /**
   * Update cart totals with Swiss VAT
   */
  static async updateCartTotals(cartId: string): Promise<PersistentCart> {
    try {
      const cart = await this.getCartById(cartId);
      if (!cart) {
        throw new Error('Cart not found');
      }

      const subtotal = cart.items.reduce((sum, item) => 
        sum + (item.product_price * item.quantity), 0
      );

      const vatCalc = SwissVATService.calculateVAT(subtotal);

      const { data, error } = await supabase
        .from('persistent_carts')
        .update({
          subtotal: vatCalc.subtotal,
          vat_amount: vatCalc.vat_amount,
          total_amount: vatCalc.total_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId)
        .select(`
          *,
          items:cart_items(*)
        `)
        .single();

      if (error) {
        console.error('Error updating cart totals:', error);
        throw new Error('Failed to update cart totals');
      }

      return data as PersistentCart;
    } catch (error) {
      console.error('Cart totals update error:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart and release inventory
   */
  static async removeFromCart(cartId: string, itemId: string): Promise<PersistentCart> {
    try {
      // Get item details for inventory release
      const { data: item } = await supabase
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (item) {
        // Release reserved inventory
        await InventoryService.releaseReservedInventory(item.product_id, item.quantity);

        // Remove from cart
        await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
      }

      return this.updateCartTotals(cartId);
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  }

  private static async getCartById(cartId: string): Promise<PersistentCart | null> {
    const { data, error } = await supabase
      .from('persistent_carts')
      .select(`
        *,
        items:cart_items(*)
      `)
      .eq('id', cartId)
      .single();

    if (error) return null;
    return data as PersistentCart;
  }

  // Mock implementations for development
  private static getMockCart(customerId?: string, sessionId?: string): PersistentCart {
    const mockCart: PersistentCart = {
      id: 'mock-cart-1',
      customer_id: customerId,
      session_id: sessionId,
      items: [],
      subtotal: 0,
      vat_amount: 0,
      total_amount: 0,
      is_gift_wrapped: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    return mockCart;
  }

  private static createMockCart(customerId?: string, sessionId?: string): PersistentCart {
    return this.getMockCart(customerId, sessionId);
  }

  private static addToMockCart(cartId: string, productId: string, quantity: number): PersistentCart {
    const mockCart = this.getMockCart();
    mockCart.items.push({
      id: `mock-item-${Date.now()}`,
      cart_id: cartId,
      product_id: productId,
      product_name: 'Mock Product',
      product_price: 29.90,
      quantity,
      category: 'mock-category',
      image_url: '/placeholder.svg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    const subtotal = mockCart.items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
    const vatCalc = SwissVATService.calculateVAT(subtotal);
    
    return {
      ...mockCart,
      subtotal: vatCalc.subtotal,
      vat_amount: vatCalc.vat_amount,
      total_amount: vatCalc.total_amount,
    };
  }
}

/**
 * Comprehensive Order Management Service
 */
export class OrderManagementService {
  /**
   * Create order from persistent cart
   */
  static async createOrderFromCart(
    cartId: string,
    customerInfo?: Partial<OrderManagement>,
    paymentIntentId?: string
  ): Promise<OrderManagement> {
    try {
      const cart = await PersistentCartService.getCartById(cartId);
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty or not found');
      }

      const orderNumber = this.generateOrderNumber();

      const orderData: Partial<OrderManagement> = {
        order_number: orderNumber,
        customer_id: cart.customer_id,
        subtotal: cart.subtotal,
        tax_amount: cart.vat_amount,
        total_amount: cart.total_amount,
        currency: 'CHF',
        status: 'pending',
        payment_status: 'pending',
        payment_intent_id: paymentIntentId,
        is_gift_wrapped: cart.is_gift_wrapped,
        gift_wrap_gender: cart.gift_wrap_gender,
        fulfillment_status: 'pending',
        ...customerInfo,
      };

      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.createMockOrder(orderData);
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        category: item.category,
        image_url: item.image_url,
        fulfillment_status: 'pending',
      }));

      await supabase
        .from('order_items')
        .insert(orderItems);

      // Convert reserved inventory to committed
      for (const item of cart.items) {
        await InventoryService.commitReservedInventory(item.product_id, item.quantity);
      }

      // Clear cart after successful order creation
      await this.clearCart(cartId);

      return this.getOrderById(order.id);
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID with full details
   */
  static async getOrderById(orderId: string): Promise<OrderManagement> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.getMockOrder(orderId);
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw new Error('Failed to fetch order');
      }

      return data as OrderManagement;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  }

  /**
   * Update order fulfillment status
   */
  static async updateFulfillmentStatus(
    orderId: string,
    status: OrderManagement['fulfillment_status'],
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        fulfillment_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      // Create fulfillment record
      await supabase
        .from('order_fulfillments')
        .insert({
          order_id: orderId,
          status,
          notes,
        });

    } catch (error) {
      console.error('Fulfillment status update error:', error);
      throw error;
    }
  }

  /**
   * Get orders with filtering and pagination
   */
  static async getOrders(filters?: {
    status?: string[];
    customer_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderManagement[]; total: number }> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          customer:profiles(full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
      }

      return {
        orders: data as OrderManagement[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Orders fetch error:', error);
      throw error;
    }
  }

  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private static async clearCart(cartId: string): Promise<void> {
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await supabase.from('persistent_carts').delete().eq('id', cartId);
  }

  // Mock implementations
  private static createMockOrder(orderData: Partial<OrderManagement>): OrderManagement {
    return {
      id: `mock-order-${Date.now()}`,
      order_number: orderData.order_number || 'MOCK-ORD-001',
      customer_id: orderData.customer_id,
      items: [],
      subtotal: orderData.subtotal || 0,
      tax_amount: orderData.tax_amount || 0,
      total_amount: orderData.total_amount || 0,
      currency: 'CHF',
      status: 'pending',
      payment_status: 'pending',
      is_gift_wrapped: false,
      fulfillment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...orderData,
    } as OrderManagement;
  }

  private static getMockOrder(orderId: string): OrderManagement {
    return this.createMockOrder({ id: orderId });
  }
}

/**
 * Product Inventory Tracking Service
 */
export class InventoryService {
  /**
   * Get product inventory status
   */
  static async getProductInventory(productId: string): Promise<InventoryItem | null> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return this.getMockInventory(productId);
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching inventory:', error);
        throw new Error('Failed to fetch inventory');
      }

      return data as InventoryItem || null;
    } catch (error) {
      console.error('Inventory fetch error:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory for cart items
   */
  static async reserveInventory(productId: string, quantity: number): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return; // Mock implementation
      }

      await supabase.rpc('reserve_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
      });
    } catch (error) {
      console.error('Inventory reservation error:', error);
      throw error;
    }
  }

  /**
   * Release reserved inventory
   */
  static async releaseReservedInventory(productId: string, quantity: number): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return; // Mock implementation
      }

      await supabase.rpc('release_reserved_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
      });
    } catch (error) {
      console.error('Inventory release error:', error);
      throw error;
    }
  }

  /**
   * Commit reserved inventory (convert to sold)
   */
  static async commitReservedInventory(productId: string, quantity: number): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return; // Mock implementation
      }

      await supabase.rpc('commit_reserved_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
      });
    } catch (error) {
      console.error('Inventory commit error:', error);
      throw error;
    }
  }

  /**
   * Check low stock products
   */
  static async getLowStockProducts(): Promise<InventoryItem[]> {
    try {
      if (FEATURE_FLAGS.USE_MOCK_ORDERS) {
        return [this.getMockInventory('mock-product-1')].filter(Boolean) as InventoryItem[];
      }

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(name, sku)
        `)
        .lt('available_quantity', supabase.rdb.ref('low_stock_threshold'));

      if (error) {
        console.error('Error fetching low stock products:', error);
        throw new Error('Failed to fetch low stock products');
      }

      return data as InventoryItem[];
    } catch (error) {
      console.error('Low stock fetch error:', error);
      throw error;
    }
  }

  private static getMockInventory(productId: string): InventoryItem {
    return {
      id: `mock-inventory-${productId}`,
      product_id: productId,
      sku: `SKU-${productId}`,
      stock_quantity: 100,
      reserved_quantity: 5,
      available_quantity: 95,
      low_stock_threshold: 10,
      is_backorder_allowed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Swiss VAT Service for compliance
 */
export class SwissVATService {
  private static readonly SWISS_VAT_RATE = 0.077; // 7.7%

  /**
   * Calculate Swiss VAT amounts
   */
  static calculateVAT(subtotal: number): SwissVATCalculation {
    const vatAmount = Math.round(subtotal * this.SWISS_VAT_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vat_rate: this.SWISS_VAT_RATE,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      currency: 'CHF',
    };
  }

  /**
   * Format Swiss currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Validate Swiss VAT number
   */
  static validateSwissVATNumber(vatNumber: string): boolean {
    // Swiss VAT number format: CHE-123.456.789 MWST
    const vatRegex = /^CHE-\d{3}\.\d{3}\.\d{3}(\sMWST)?$/;
    return vatRegex.test(vatNumber);
  }
}

export {
  PersistentCartService,
  OrderManagementService,
  InventoryService,
  SwissVATService,
};