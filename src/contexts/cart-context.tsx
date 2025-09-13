import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/config/api';
import { toast } from '@/components/ui/sonner';

interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  category: string;
  image: string;
  isGiftWrapped?: boolean;
}

interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
}

interface Order {
  id: string;
  customer_id?: string;
  items: OrderItem[];
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  payment_intent_id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'isGiftWrapped'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleGiftWrap: () => void;
  setGiftWrapGender: (gender: 'men' | 'women') => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isGiftWrapped: boolean;
  giftWrapGender: 'men' | 'women';
  // Order processing
  createOrder: (paymentIntentId: string, customerId?: string) => Promise<Order>;
  getOrderHistory: (customerId: string) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  // Swiss VAT calculation
  calculateVAT: (amount: number) => number;
  getTotalWithVAT: (amount: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftWrapGender, setGiftWrapGender] = useState<'men' | 'women'>('women');

  const addToCart = (item: Omit<CartItem, 'quantity' | 'isGiftWrapped'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1, isGiftWrapped: false }];
    });
  };

  const toggleGiftWrap = () => {
    setIsGiftWrapped(prev => !prev);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('CHF ', ''));
    return sum + (price * item.quantity);
  }, 0) + (isGiftWrapped ? 5 : 0);

  // Swiss VAT calculation (7.7%)
  const calculateVAT = (amount: number): number => {
    return amount * 0.077;
  };

  const getTotalWithVAT = (amount: number): number => {
    return amount * 1.077;
  };

  // Order processing functions
  const createOrder = async (paymentIntentId: string, customerId?: string): Promise<Order> => {
    try {
      const subtotal = totalPrice;
      const vatAmount = calculateVAT(subtotal);
      const totalAmount = getTotalWithVAT(subtotal);

      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: crypto.randomUUID(),
        product_id: item.id,
        name: item.name,
        price: parseFloat(item.price.replace('CHF ', '')),
        quantity: item.quantity,
        category: item.category,
        image: item.image,
      }));

      const orderData = {
        customer_id: customerId,
        items: orderItems,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        payment_intent_id: paymentIntentId,
        status: 'paid' as const,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
      }

      toast.success('Bestellung erfolgreich erstellt!');
      return data as Order;
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Fehler beim Erstellen der Bestellung');
      throw error;
    }
  };

  const getOrderHistory = async (customerId: string): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching order history:', error);
        throw new Error('Failed to fetch order history');
      }

      return data as Order[];
    } catch (error) {
      console.error('Order history fetch error:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
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

      toast.success('Bestellstatus aktualisiert');
    } catch (error) {
      console.error('Order status update error:', error);
      toast.error('Fehler beim Aktualisieren des Bestellstatus');
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleGiftWrap,
      setGiftWrapGender,
      clearCart,
      totalItems,
      totalPrice,
      isGiftWrapped,
      giftWrapGender,
      createOrder,
      getOrderHistory,
      updateOrderStatus,
      calculateVAT,
      getTotalWithVAT
    }}>
      {children}
    </CartContext.Provider>
  );
};