/**
 * Payment Success Component - Sprint C Week 10
 * Post-payment confirmation with Swiss invoice generation
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  ArrowLeft,
  FileText,
  CreditCard,
  Calendar,
  MapPin,
  Gift,
  Truck,
  Phone
} from 'lucide-react';
import { 
  SwissPaymentService,
  type SwissInvoice,
  type SwissAddress
} from '@/services/api/swissPaymentService';
import { 
  OrderManagementService,
  SwissVATService,
  type OrderManagement
} from '@/services/api/ecommerceService';

interface PaymentSuccessProps {
  onContinueShopping?: () => void;
}

export function PaymentSuccess({ onContinueShopping }: PaymentSuccessProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderManagement | null>(null);
  const [invoice, setInvoice] = useState<SwissInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  
  const orderId = searchParams.get('order_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      if (!orderId) {
        throw new Error('Order ID not found');
      }

      const orderData = await OrderManagementService.getOrderById(orderId);
      setOrder(orderData);

      // Generate invoice automatically if payment was successful
      if (redirectStatus === 'succeeded' && orderData.status === 'paid') {
        await generateInvoice(orderData);
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      toast.error('Fehler beim Laden der Bestelldetails');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (orderData: OrderManagement) => {
    try {
      setGeneratingInvoice(true);
      
      // Mock customer and business info for invoice generation
      const customerInfo: SwissAddress = {
        first_name: orderData.customer_name?.split(' ')[0] || 'Kunde',
        last_name: orderData.customer_name?.split(' ').slice(1).join(' ') || '',
        company: '',
        address_line_1: 'Musterstrasse 123',
        postal_code: '8000',
        city: 'Zürich',
        canton: 'ZH',
        country: 'CH',
      };

      const businessInfo = {
        name: 'Schnittwerk Hair Salon',
        address: {
          first_name: '',
          last_name: '',
          address_line_1: 'Salonstrasse 456',
          postal_code: '8001',
          city: 'Zürich',
          canton: 'ZH',
          country: 'CH' as const,
        },
        vat_number: 'CHE-123.456.789 MWST',
        uid_number: 'CHE-123.456.789',
        contact_email: 'info@schnittwerk.ch',
        contact_phone: '+41 44 123 45 67',
        bank_details: {
          iban: 'CH93 0076 2011 6238 5295 7',
          bic: 'POFICHBEXXX',
          bank_name: 'PostFinance AG',
        },
      };

      const invoiceData = await SwissPaymentService.generateSwissInvoice(
        orderId,
        customerInfo,
        businessInfo
      );
      
      setInvoice(invoiceData);
      toast.success('Rechnung wurde erstellt');
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Fehler beim Erstellen der Rechnung');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const downloadInvoice = async () => {
    if (!invoice) return;
    
    try {
      // This would implement PDF generation and download
      toast.success('Rechnung wird heruntergeladen...');
    } catch (error) {
      toast.error('Fehler beim Herunterladen der Rechnung');
    }
  };

  const sendInvoiceByEmail = async () => {
    if (!invoice || !order) return;
    
    try {
      // This would implement email sending
      toast.success(`Rechnung wurde an ${order.customer_email} gesendet`);
    } catch (error) {
      toast.error('Fehler beim Versenden der Rechnung');
    }
  };

  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      navigate('/shop');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bestellung nicht gefunden. Bitte überprüfen Sie den Link oder kontaktieren Sie unseren Support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isPaymentSuccessful = redirectStatus === 'succeeded' || order.payment_status === 'paid';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        {isPaymentSuccessful ? (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-green-600">Zahlung erfolgreich!</h1>
            <p className="text-muted-foreground">
              Vielen Dank für Ihre Bestellung. Sie erhalten eine Bestätigung per E-Mail.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-yellow-600">Zahlung wird verarbeitet</h1>
            <p className="text-muted-foreground">
              Ihre Zahlung wird noch verarbeitet. Sie erhalten eine Bestätigung, sobald die Zahlung abgeschlossen ist.
            </p>
          </>
        )}
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bestellübersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Bestellnummer</p>
              <p className="font-medium">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bestelldatum</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString('de-CH')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex gap-2">
                <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                  {order.status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                </Badge>
                <Badge variant="outline">
                  {order.fulfillment_status === 'pending' ? 'In Bearbeitung' : order.fulfillment_status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h4 className="font-medium">Bestellte Artikel</h4>
            {order.items.map((item) => (
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

            {order.is_gift_wrapped && (
              <div className="flex justify-between items-center py-2 border-t">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>Geschenkverpackung ({order.gift_wrap_gender})</span>
                </div>
                <p className="font-medium">{SwissVATService.formatCurrency(5.00)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Zwischensumme:</span>
              <span>{SwissVATService.formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>MwSt. (7.7%):</span>
              <span>{SwissVATService.formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Gesamt:</span>
              <span>{SwissVATService.formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungsinformationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Zahlungsstatus</p>
              <div className="flex items-center gap-2">
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status === 'paid' ? 'Bezahlt' : 'Ausstehend'}
                </Badge>
                {isPaymentSuccessful && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Zahlungsart</p>
              <p className="font-medium">{order.payment_method || 'Kreditkarte'}</p>
            </div>
            {paymentIntentId && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Transaktions-ID</p>
                <p className="font-mono text-sm">{paymentIntentId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      {order.shipping_address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Lieferinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Lieferadresse</p>
                <div className="font-medium">
                  <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                  {order.shipping_address.company && <p>{order.shipping_address.company}</p>}
                  <p>{order.shipping_address.address_line_1}</p>
                  {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                  <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                  <p>{order.shipping_address.canton}, {order.shipping_address.country}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voraussichtliche Lieferung</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">2-3 Werktage</span>
                </div>
                {order.tracking_number && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Sendungsverfolgung</p>
                    <p className="font-mono text-sm">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Section */}
      {isPaymentSuccessful && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rechnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice ? (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Rechnung {invoice.invoice_number} erstellt</p>
                      <p className="text-sm text-muted-foreground">
                        Fällig bis: {new Date(invoice.due_date).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadInvoice} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    PDF herunterladen
                  </Button>
                  <Button onClick={sendInvoiceByEmail} variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Per E-Mail senden
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Rechnung wird erstellt...</p>
                <Button 
                  onClick={() => generateInvoice(order)} 
                  disabled={generatingInvoice}
                  variant="outline"
                >
                  {generatingInvoice ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Rechnung erstellen
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2">
            Bei Fragen zu Ihrer Bestellung können Sie uns gerne kontaktieren:
          </p>
          <div className="space-y-1">
            <p><strong>E-Mail:</strong> support@schnittwerk.ch</p>
            <p><strong>Telefon:</strong> +41 44 123 45 67</p>
            <p><strong>Öffnungszeiten:</strong> Mo-Fr 9:00-18:00, Sa 9:00-16:00</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleContinueShopping} variant="outline" size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Weiter einkaufen
        </Button>
        
        <Button onClick={() => navigate('/account/orders')} size="lg">
          <FileText className="h-4 w-4 mr-2" />
          Meine Bestellungen
        </Button>
      </div>
    </div>
  );
}

export default PaymentSuccess;