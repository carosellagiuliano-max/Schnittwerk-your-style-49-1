import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/cart-context';
import CheckoutFlow from '@/components/payment/CheckoutFlow';
import { toast } from 'sonner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentFlowIntegrationExample: React.FC = () => {
  const { cartItems, addToCart, clearCart, totalPrice } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const handleAddProduct = () => {
    if (productName && productPrice) {
      addToCart({
        id: `prod_${Date.now()}`,
        name: productName,
        price: `CHF ${parseFloat(productPrice).toFixed(2)}`,
        category: 'Test Products',
        image: '/placeholder.svg'
      });
      setProductName('');
      setProductPrice('');
      toast.success(`${productName} added to cart!`);
    } else {
      toast.error('Please enter product name and price.');
    }
  };

  const handleCheckoutComplete = (paymentIntentId: string) => {
    setShowCheckout(false);
    toast.success(`Checkout completed! Payment Intent ID: ${paymentIntentId}`);
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    toast.info('Checkout cancelled.');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Payment Flow Integration Example</h1>

      {/* Product Adder */}
      <Card>
        <CardHeader>
          <CardTitle>Add Test Product to Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Hair Conditioner"
              />
            </div>
            <div>
              <Label htmlFor="productPrice">Price (CHF)</Label>
              <Input
                id="productPrice"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="e.g., 25.50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddProduct} className="flex-1">
              Add to Cart
            </Button>
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Your Cart ({cartItems.length} items)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cartItems.length === 0 ? (
            <p className="text-muted-foreground text-center">Cart is empty.</p>
          ) : (
            <>
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>{item.price}</span>
                </div>
              ))}
              <div className="flex justify-between items-center text-lg font-bold mt-4">
                <span>Total:</span>
                <span>CHF {totalPrice.toFixed(2)}</span>
              </div>
              <Button 
                onClick={() => setShowCheckout(true)} 
                className="w-full mt-4"
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Checkout Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4">
            <CheckoutFlow 
              onComplete={handleCheckoutComplete}
              onCancel={handleCheckoutCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFlowIntegrationExample;