/**
 * Order Management Dashboard - Sprint C Week 9
 * Comprehensive order fulfillment workflow with Swiss compliance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { 
  Package, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  User,
  CreditCard,
  FileText,
  Gift
} from 'lucide-react';
import { 
  OrderManagementService,
  SwissVATService,
  type OrderManagement,
  type OrderFulfillment
} from '@/services/api/ecommerceService';

interface OrderFilters {
  status?: string[];
  fulfillment_status?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export function OrderManagementDashboard() {
  const [orders, setOrders] = useState<OrderManagement[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  useEffect(() => {
    loadOrders();
  }, [filters, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { orders: ordersData, total } = await OrderManagementService.getOrders({
        ...filters,
        limit: ordersPerPage,
        offset: (currentPage - 1) * ordersPerPage,
      });
      
      setOrders(ordersData);
      setTotalOrders(total);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const updateFulfillmentStatus = async (
    orderId: string, 
    status: OrderManagement['fulfillment_status'],
    notes?: string
  ) => {
    try {
      setUpdating(orderId);
      await OrderManagementService.updateFulfillmentStatus(orderId, status, notes);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, fulfillment_status: status, notes }
          : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, fulfillment_status: status, notes });
      }
      
      toast.success('Bestellstatus aktualisiert');
    } catch (error) {
      console.error('Failed to update fulfillment status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string, type: 'order' | 'fulfillment' | 'payment') => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      // Order status
      pending: 'outline',
      paid: 'default',
      processing: 'secondary',
      cancelled: 'destructive',
      refunded: 'destructive',
      
      // Fulfillment status
      prepared: 'secondary',
      ready_for_pickup: 'default',
      shipped: 'default',
      delivered: 'default',
      
      // Payment status
      deposit_paid: 'secondary',
      failed: 'destructive',
    };

    const labels: Record<string, string> = {
      // Order status
      pending: 'Ausstehend',
      paid: 'Bezahlt',
      processing: 'In Bearbeitung',
      shipped: 'Versandt',
      delivered: 'Zugestellt',
      cancelled: 'Storniert',
      refunded: 'Erstattet',
      
      // Fulfillment status
      prepared: 'Vorbereitet',
      ready_for_pickup: 'Abholbereit',
      
      // Payment status
      deposit_paid: 'Anzahlung',
      failed: 'Fehlgeschlagen',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      paid: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: AlertCircle,
      prepared: Package,
      ready_for_pickup: CheckCircle,
    };
    
    const IconComponent = icons[status as keyof typeof icons] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  const exportOrders = async () => {
    try {
      // This would implement PDF/CSV export functionality
      toast.success('Export wird vorbereitet...');
    } catch (error) {
      toast.error('Fehler beim Export');
    }
  };

  const OrderDetailModal = ({ order }: { order: OrderManagement }) => {
    const [fulfillmentNotes, setFulfillmentNotes] = useState(order.notes || '');

    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bestellung {order.order_number}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {getStatusBadge(order.status, 'order')}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.fulfillment_status)}
                    {getStatusBadge(order.fulfillment_status, 'fulfillment')}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.payment_status)}
                    {getStatusBadge(order.payment_status, 'payment')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kunde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="font-medium">{order.customer_name || 'Gast'}</p>
                  {order.customer_email && (
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  )}
                  {order.customer_phone && (
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bestelldetails
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-sm">
                    Erstellt: {new Date(order.created_at).toLocaleDateString('de-CH')}
                  </p>
                  <p className="text-sm">
                    Artikel: {order.items.length}
                  </p>
                  <p className="font-medium">
                    Total: {SwissVATService.formatCurrency(order.total_amount)}
                  </p>
                  {order.is_gift_wrapped && (
                    <div className="flex items-center gap-1 text-sm">
                      <Gift className="h-3 w-3" />
                      Geschenkverpackung ({order.gift_wrap_gender})
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bestellte Artikel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <p className="text-sm">
                          {item.quantity}x {SwissVATService.formatCurrency(item.product_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {SwissVATService.formatCurrency(item.product_price * item.quantity)}
                        </p>
                        {getStatusBadge(item.fulfillment_status, 'fulfillment')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preisaufschlüsselung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Zwischensumme:</span>
                  <span>{SwissVATService.formatCurrency(order.subtotal)}</span>
                </div>
                {order.is_gift_wrapped && (
                  <div className="flex justify-between">
                    <span>Geschenkverpackung:</span>
                    <span>{SwissVATService.formatCurrency(5.00)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>MwSt. (7.7%):</span>
                  <span>{SwissVATService.formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Gesamt:</span>
                    <span>{SwissVATService.formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bestellabwicklung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status ändern</Label>
                    <Select 
                      value={order.fulfillment_status}
                      onValueChange={(value) => 
                        updateFulfillmentStatus(order.id, value as OrderManagement['fulfillment_status'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Ausstehend</SelectItem>
                        <SelectItem value="prepared">Vorbereitet</SelectItem>
                        <SelectItem value="ready_for_pickup">Abholbereit</SelectItem>
                        <SelectItem value="shipped">Versandt</SelectItem>
                        <SelectItem value="delivered">Zugestellt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {order.tracking_number && (
                    <div className="space-y-2">
                      <Label>Sendungsverfolgung</Label>
                      <Input value={order.tracking_number} readOnly />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notizen</Label>
                  <Textarea
                    value={fulfillmentNotes}
                    onChange={(e) => setFulfillmentNotes(e.target.value)}
                    placeholder="Interne Notizen zur Bestellabwicklung..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateFulfillmentStatus(order.id, order.fulfillment_status, fulfillmentNotes)}
                    disabled={updating === order.id}
                  >
                    Notizen speichern
                  </Button>
                  
                  <Button variant="outline" onClick={() => {}}>
                    <FileText className="h-4 w-4 mr-2" />
                    Rechnung drucken
                  </Button>
                  
                  <Button variant="outline" onClick={() => {}}>
                    <Package className="h-4 w-4 mr-2" />
                    Lieferschein drucken
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lieferadresse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order.shipping_address.first_name} {order.shipping_address.last_name}
                    </p>
                    {order.shipping_address.company && (
                      <p>{order.shipping_address.company}</p>
                    )}
                    <p>{order.shipping_address.address_line_1}</p>
                    {order.shipping_address.address_line_2 && (
                      <p>{order.shipping_address.address_line_2}</p>
                    )}
                    <p>
                      {order.shipping_address.postal_code} {order.shipping_address.city}
                    </p>
                    <p>{order.shipping_address.country}</p>
                    {order.shipping_address.canton && (
                      <p>Kanton: {order.shipping_address.canton}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    );
  };

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bestellverwaltung</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Bestellnummer, Kunde..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bestellstatus</Label>
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) => 
                  setFilters({ ...filters, status: value ? [value] : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Status</SelectItem>
                  <SelectItem value="pending">Ausstehend</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="processing">In Bearbeitung</SelectItem>
                  <SelectItem value="shipped">Versandt</SelectItem>
                  <SelectItem value="delivered">Zugestellt</SelectItem>
                  <SelectItem value="cancelled">Storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Abwicklungsstatus</Label>
              <Select
                value={filters.fulfillment_status?.[0] || ''}
                onValueChange={(value) => 
                  setFilters({ ...filters, fulfillment_status: value ? [value] : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Status</SelectItem>
                  <SelectItem value="pending">Ausstehend</SelectItem>
                  <SelectItem value="prepared">Vorbereitet</SelectItem>
                  <SelectItem value="ready_for_pickup">Abholbereit</SelectItem>
                  <SelectItem value="shipped">Versandt</SelectItem>
                  <SelectItem value="delivered">Zugestellt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Datum von</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bestellungen ({totalOrders})</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Seite {currentPage} von {totalPages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Bestellungen gefunden</p>
              <p className="text-sm">Ändern Sie die Filter oder erstellen Sie eine neue Bestellung</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('de-CH')}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">{order.customer_name || 'Gast'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} Artikel
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">
                        {SwissVATService.formatCurrency(order.total_amount)}
                      </p>
                      {getStatusBadge(order.payment_status, 'payment')}
                    </div>

                    <div className="flex flex-col gap-1">
                      {getStatusBadge(order.status, 'order')}
                      {getStatusBadge(order.fulfillment_status, 'fulfillment')}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        {selectedOrder && <OrderDetailModal order={selectedOrder} />}
                      </Dialog>

                      <Select
                        value={order.fulfillment_status}
                        onValueChange={(value) => 
                          updateFulfillmentStatus(order.id, value as OrderManagement['fulfillment_status'])
                        }
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Ausstehend</SelectItem>
                          <SelectItem value="prepared">Vorbereitet</SelectItem>
                          <SelectItem value="ready_for_pickup">Abholbereit</SelectItem>
                          <SelectItem value="shipped">Versandt</SelectItem>
                          <SelectItem value="delivered">Zugestellt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Zurück
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Weiter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderManagementDashboard;