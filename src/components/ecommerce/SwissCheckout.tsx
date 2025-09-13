/**
 * Swiss Checkout Component - Sprint C Week 10
 * Stripe integration with Swiss payment methods and CHF compliance
 */

import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Zap,
  Lock,
  AlertCircle,
  CheckCircle,
  Euro,
  FileText,
  User,
  MapPin,
  Gift
} from 'lucide-react';
import { stripePromise, STRIPE_CONFIG } from '@/config/stripe';
import { 
  SwissPaymentService,
  type SwissPaymentIntent,
  type SwissAddress,
  type PaymentRequest,
  type SwissPaymentMethod
} from '@/services/api/swissPaymentService';
import { 
  SwissVATService,
  type PersistentCart
} from '@/services/api/ecommerceService';

interface SwissCheckoutProps {
  cart: PersistentCart;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  customerId?: string;
}

interface CustomerInfo {
  email: string;
  phone: string;
  shipping_address: SwissAddress;
  billing_address: SwissAddress;
  use_same_address: boolean;
  special_instructions?: string;
  newsletter_consent: boolean;
  terms_accepted: boolean;
}

const SWISS_CANTONS = [
  { code: 'AG', name: 'Aargau' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'BE', name: 'Bern' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'GE', name: 'Genf' },
  { code: 'GL', name: 'Glarus' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Luzern' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' },
  { code: 'UR', name: 'Uri' },
  { code: 'VD', name: 'Waadt' },
  { code: 'VS', name: 'Wallis' },
  { code: 'ZG', name: 'Zug' },
  { code: 'ZH', name: 'Zürich' },
];

function SwissCheckoutForm({ cart, onPaymentSuccess, onPaymentError, customerId }: SwissCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentMethods, setPaymentMethods] = useState<SwissPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [paymentIntent, setPaymentIntent] = useState<SwissPaymentIntent | null>(null);
  const [processing, setProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    phone: '',
    shipping_address: {
      first_name: '',
      last_name: '',
      company: '',
      address_line_1: '',
      address_line_2: '',
      postal_code: '',
      city: '',
      canton: '',
      country: 'CH',
    },
    billing_address: {
      first_name: '',
      last_name: '',
      company: '',
      address_line_1: '',
      address_line_2: '',
      postal_code: '',
      city: '',
      canton: '',
      country: 'CH',
    },
    use_same_address: true,
    newsletter_consent: false,
    terms_accepted: false,
  });

  useEffect(() => {
    loadPaymentMethods();
    createPaymentIntent();
  }, [cart]);

  const loadPaymentMethods = () => {
    const methods = SwissPaymentService.getSwissPaymentMethods();
    setPaymentMethods(methods.filter(m => m.is_active));
  };

  const createPaymentIntent = async () => {
    try {
      const vatCalc = SwissVATService.calculateVAT(cart.subtotal);
      const totalAmount = Math.round(vatCalc.total_amount * 100); // Convert to Rappen

      const request: PaymentRequest = {
        order_id: cart.id,
        amount: totalAmount,
        currency: 'chf',
        customer_id: customerId,
        customer_email: customerInfo.email || undefined,
        payment_method_types: [selectedPaymentMethod],
        metadata: {
          cart_id: cart.id,
          customer_id: customerId || '',
          gift_wrapped: cart.is_gift_wrapped.toString(),
          gift_wrap_gender: cart.gift_wrap_gender || '',
        },
        description: `Schnittwerk Order - ${cart.items.length} items`,
        automatic_payment_methods: true,
      };

      const intent = await SwissPaymentService.createPaymentIntent(request);
      setPaymentIntent(intent);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      toast.error('Fehler beim Erstellen der Zahlung');
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    // Validate customer information
    if (!validateCustomerInfo()) {
      return;
    }

    setProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/payment-success?order_id=${cart.id}`;
      
      const confirmation = await SwissPaymentService.confirmPayment(
        paymentIntent.client_secret,
        elements,
        returnUrl
      );

      if (confirmation.status === 'succeeded') {
        toast.success('Zahlung erfolgreich!');
        onPaymentSuccess(confirmation.payment_intent_id);
      } else if (confirmation.status === 'requires_action') {
        toast.info('Bitte folgen Sie den Anweisungen Ihrer Bank');
      } else {
        throw new Error(confirmation.failure_reason || 'Zahlung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = (error as Error).message;
      toast.error(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const validateCustomerInfo = (): boolean => {
    const errors: string[] = [];

    if (!customerInfo.email) {
      errors.push('E-Mail-Adresse ist erforderlich');
    }

    if (!customerInfo.shipping_address.first_name || !customerInfo.shipping_address.last_name) {
      errors.push('Vor- und Nachname sind erforderlich');
    }

    if (!customerInfo.shipping_address.address_line_1) {
      errors.push('Adresse ist erforderlich');
    }

    if (!customerInfo.shipping_address.postal_code || !customerInfo.shipping_address.city) {
      errors.push('PLZ und Ort sind erforderlich');
    }

    if (!customerInfo.shipping_address.canton) {
      errors.push('Kanton ist erforderlich');
    }

    if (!customerInfo.terms_accepted) {
      errors.push('Bitte akzeptieren Sie die AGB');
    }

    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }

    return true;
  };

  const updateShippingAddress = (field: keyof SwissAddress, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      shipping_address: {
        ...prev.shipping_address,
        [field]: value,
      },
      billing_address: prev.use_same_address ? {
        ...prev.shipping_address,
        [field]: value,
      } : prev.billing_address,
    }));
  };

  const updateBillingAddress = (field: keyof SwissAddress, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      billing_address: {
        ...prev.billing_address,
        [field]: value,
      },
    }));
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'twint':
        return <Smartphone className="h-5 w-5" />;
      case 'postfinance':
        return <Building className="h-5 w-5" />;
      case 'sofort':
        return <Zap className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const vatCalculation = SwissVATService.calculateVAT(cart.subtotal);

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bestellübersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2">
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity}x {SwissVATService.formatCurrency(item.product_price)}
                </p>
              </div>
              <p className="font-medium">
                {SwissVATService.formatCurrency(item.product_price * item.quantity)}
              </p>
            </div>
          ))}

          {cart.is_gift_wrapped && (
            <div className="flex justify-between items-center py-2 border-t">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span>Geschenkverpackung ({cart.gift_wrap_gender})</span>
              </div>
              <p className="font-medium">{SwissVATService.formatCurrency(5.00)}</p>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span>Zwischensumme:</span>
              <span>{SwissVATService.formatCurrency(vatCalculation.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>MwSt. (7.7%):</span>
              <span>{SwissVATService.formatCurrency(vatCalculation.vat_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Gesamt:</span>
              <span>{SwissVATService.formatCurrency(vatCalculation.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kundendaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ihre@email.ch"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+41 79 123 45 67"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lieferadresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_first_name">Vorname *</Label>
              <Input
                id="shipping_first_name"
                value={customerInfo.shipping_address.first_name}
                onChange={(e) => updateShippingAddress('first_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_last_name">Nachname *</Label>
              <Input
                id="shipping_last_name"
                value={customerInfo.shipping_address.last_name}
                onChange={(e) => updateShippingAddress('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_company">Firma (optional)</Label>
            <Input
              id="shipping_company"
              value={customerInfo.shipping_address.company}
              onChange={(e) => updateShippingAddress('company', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_address_1">Adresse *</Label>
            <Input
              id="shipping_address_1"
              value={customerInfo.shipping_address.address_line_1}
              onChange={(e) => updateShippingAddress('address_line_1', e.target.value)}
              placeholder="Strasse und Hausnummer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_address_2">Adresszusatz</Label>
            <Input
              id="shipping_address_2"
              value={customerInfo.shipping_address.address_line_2}
              onChange={(e) => updateShippingAddress('address_line_2', e.target.value)}
              placeholder="Postfach, c/o, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_postal_code">PLZ *</Label>
              <Input
                id="shipping_postal_code"
                value={customerInfo.shipping_address.postal_code}
                onChange={(e) => updateShippingAddress('postal_code', e.target.value)}
                placeholder="8000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_city">Ort *</Label>
              <Input
                id="shipping_city"
                value={customerInfo.shipping_address.city}
                onChange={(e) => updateShippingAddress('city', e.target.value)}
                placeholder="Zürich"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping_canton">Kanton *</Label>
              <Select
                value={customerInfo.shipping_address.canton}
                onValueChange={(value) => updateShippingAddress('canton', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kanton wählen" />
                </SelectTrigger>
                <SelectContent>
                  {SWISS_CANTONS.map((canton) => (
                    <SelectItem key={canton.code} value={canton.code}>
                      {canton.name} ({canton.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Rechnungsadresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use_same_address"
              checked={customerInfo.use_same_address}
              onCheckedChange={(checked) => {
                setCustomerInfo(prev => ({
                  ...prev,
                  use_same_address: checked as boolean,
                  billing_address: checked ? prev.shipping_address : prev.billing_address,
                }));
              }}
            />
            <Label htmlFor="use_same_address">
              Gleiche Adresse wie Lieferadresse verwenden
            </Label>
          </div>

          {!customerInfo.use_same_address && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billing_first_name">Vorname *</Label>
                  <Input
                    id="billing_first_name"
                    value={customerInfo.billing_address.first_name}
                    onChange={(e) => updateBillingAddress('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_last_name">Nachname *</Label>
                  <Input
                    id="billing_last_name"
                    value={customerInfo.billing_address.last_name}
                    onChange={(e) => updateBillingAddress('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Additional billing address fields */}
              <div className="space-y-2">
                <Label htmlFor="billing_vat_number">MwSt-Nummer (für Unternehmen)</Label>
                <Input
                  id="billing_vat_number"
                  value={customerInfo.billing_address.vat_number || ''}
                  onChange={(e) => updateBillingAddress('vat_number', e.target.value)}
                  placeholder="CHE-123.456.789 MWST"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungsart
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-colors ${
                  selectedPaymentMethod === method.type ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPaymentMethod(method.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(method.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{method.display_name}</h4>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    {method.processing_fee_percentage > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{method.processing_fee_percentage}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {paymentIntent && (
            <div className="mt-6">
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: [selectedPaymentMethod as any],
                  ...STRIPE_CONFIG,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Zusätzliche Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="special_instructions">Besondere Wünsche</Label>
            <Textarea
              id="special_instructions"
              value={customerInfo.special_instructions || ''}
              onChange={(e) => setCustomerInfo(prev => ({ 
                ...prev, 
                special_instructions: e.target.value 
              }))}
              placeholder="Lieferzeitpunkt, besondere Anweisungen..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newsletter_consent"
                checked={customerInfo.newsletter_consent}
                onCheckedChange={(checked) => setCustomerInfo(prev => ({ 
                  ...prev, 
                  newsletter_consent: checked as boolean 
                }))}
              />
              <Label htmlFor="newsletter_consent" className="text-sm">
                Ich möchte über Neuigkeiten und Angebote informiert werden
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={customerInfo.terms_accepted}
                onCheckedChange={(checked) => setCustomerInfo(prev => ({ 
                  ...prev, 
                  terms_accepted: checked as boolean 
                }))}
                required
              />
              <Label htmlFor="terms_accepted" className="text-sm">
                Ich akzeptiere die <a href="/agb" className="underline">AGB</a> und 
                <a href="/datenschutz" className="underline ml-1">Datenschutzerklärung</a> *
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Sichere Zahlung:</strong> Ihre Zahlungsinformationen werden sicher über SSL verschlüsselt 
          und von Stripe, einem PCI-DSS zertifizierten Zahlungsdienstleister, verarbeitet.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Card>
        <CardContent className="p-6">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!stripe || !paymentIntent || processing || !customerInfo.terms_accepted}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Zahlung wird verarbeitet...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Jetzt bezahlen {SwissVATService.formatCurrency(vatCalculation.total_amount)}
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              SSL-verschlüsselt
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              PCI-DSS konform
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Schweizer Datenschutz
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export function SwissCheckout(props: SwissCheckoutProps) {
  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        appearance: STRIPE_CONFIG.appearance,
        locale: STRIPE_CONFIG.locale as any,
      }}
    >
      <SwissCheckoutForm {...props} />
    </Elements>
  );
}

export default SwissCheckout;