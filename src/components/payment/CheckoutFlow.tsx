import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingBag, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PaymentForm from './PaymentForm';
import { useCart } from '@/contexts/cart-context';
import { formatSwissCurrency } from '@/utils/swiss-formatting';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

interface CheckoutFlowProps {
  onComplete: (paymentIntentId: string) => void;
  onCancel: () => void;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onComplete, onCancel }) => {
  const { cartItems, totalPrice, clearCart, createOrder } = useCart();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  const parsePrice = (priceString: string): number => {
      const numericString = String(priceString).replace(/[^0-9.]/g, '');
      return parseFloat(numericString);
  };

  useEffect(() => {
    if (cartItems.length > 0) {
      createPaymentIntent();
    } else {
      setLoading(false);
    }
  }, [cartItems, totalPrice]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/.netlify/functions/stripe-create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 1.077 * 100), // Convert to cents, including VAT
          currency: 'chf',
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: parsePrice(item.price),
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data: PaymentIntentResponse = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Create order in database
      await createOrder(paymentIntentId);

      // Confirm payment on backend
      const response = await fetch('/.netlify/functions/stripe-confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      setStep('success');
      clearCart();
      onComplete(paymentIntentId);
      toast.success('Zahlung erfolgreich! Bestellung wurde erstellt.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment confirmation failed';
      toast.error(errorMessage);
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    toast.error(error);
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Bestellübersicht</h2>
        <p className="text-muted-foreground">Überprüfen Sie Ihre Bestellung vor der Zahlung</p>
      </div>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <Badge variant="secondary">{formatSwissCurrency(parsePrice(item.price) * item.quantity)}</Badge>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Zwischensumme</span>
          <span>{formatSwissCurrency(totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>MWST (7.7%)</span>
          <span>{formatSwissCurrency(totalPrice * 0.077)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Gesamtbetrag</span>
          <span>{formatSwissCurrency(totalPrice * 1.077)}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Abbrechen
        </Button>
        <Button
          onClick={() => setStep('payment')}
          className="flex-1"
          disabled={cartItems.length === 0}
        >
          Weiter zur Zahlung
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Zahlung</h2>
        <p className="text-muted-foreground">Geben Sie Ihre Zahlungsinformationen ein</p>
      </div>

      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            clientSecret={clientSecret}
            amount={totalPrice * 1.077} // Include VAT
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      ) : <Loader2 className="h-8 w-8 animate-spin" />}

      <Button
        variant="outline"
        onClick={() => setStep('review')}
        className="w-full"
      >
        Zurück zur Übersicht
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <h2 className="text-2xl font-bold mb-2">Zahlung erfolgreich!</h2>
        <p className="text-muted-foreground">
          Vielen Dank für Ihre Bestellung. Ihre Bestell-ID lautet: {paymentIntentId.split('_secret')[0]}
        </p>
      </div>
      <Button onClick={onCancel} className="w-full">
        Schliessen
      </Button>
    </div>
  );
  
  const renderEmptyCart = () => (
    <div className="text-center p-8">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Ihr Warenkorb ist leer</h3>
        <p className="mt-1 text-sm text-muted-foreground">Fügen Sie Produkte hinzu, um den Bezahlvorgang zu starten.</p>
        <Button onClick={onCancel} className="mt-6">
         Weiter einkaufen
        </Button>
    </div>
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={createPaymentIntent} variant="outline" className="mt-4">
            Erneut versuchen
        </Button>
      </Alert>
    );
  }

  if (cartItems.length === 0 && step !== 'success') {
      return renderEmptyCart();
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Checkout
        </CardTitle>
        <CardDescription>
          {step === 'review' && 'Überprüfen Sie Ihre Bestellung'}
          {step === 'payment' && 'Sichere Zahlung mit Stripe'}
          {step === 'success' && 'Bestellung abgeschlossen'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'review' && renderReviewStep()}
        {step === 'payment' && renderPaymentStep()}
        {step === 'success' && renderSuccessStep()}
      </CardContent>
    </Card>
  );
};

export default CheckoutFlow;