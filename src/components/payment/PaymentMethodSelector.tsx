import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  onContinue: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  onContinue,
}) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Kreditkarte',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
    },
    {
      id: 'twint',
      name: 'TWINT',
      description: 'Schweizer Mobile Payment',
      icon: Smartphone,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Schnell und sicher bezahlen',
      icon: Wallet,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Zahlungsmethode wählen</CardTitle>
        <CardDescription>
          Wählen Sie Ihre bevorzugte Zahlungsmethode für diese Bestellung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMethod} onValueChange={onMethodChange} className="space-y-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex items-center space-x-3 cursor-pointer flex-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-muted-foreground">{method.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-6">
          <Button onClick={onContinue} className="w-full">
            Weiter
          </Button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>Ihre Zahlungsdaten werden sicher mit Stripe verarbeitet</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;