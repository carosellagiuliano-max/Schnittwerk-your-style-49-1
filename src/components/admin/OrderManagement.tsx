import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Package,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { OrderService, Order } from '@/services/orderService';
import { formatSwissCurrency } from '@/utils/swiss-formatting';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface OrderManagementProps {
  refreshTrigger?: number;
}

export function OrderManagement({ refreshTrigger }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [refreshTrigger]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderData = await OrderService.getAllOrders();
      setOrders(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Refresh the list
      toast.success('Bestellstatus aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Bestellstatus');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, label: 'Bestätigt', icon: CheckCircle },
      pending: { variant: 'secondary' as const, label: 'Ausstehend', icon: Clock },
      completed: { variant: 'default' as const, label: 'Abgeschlossen', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Storniert', icon: XCircle },
      processing: { variant: 'secondary' as const, label: 'In Bearbeitung', icon: Package },
      no_show: { variant: 'destructive' as const, label: 'Nicht erschienen', icon: AlertTriangle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: Order['payment_status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Ausstehend', icon: Clock },
      deposit_paid: { variant: 'default' as const, label: 'Anzahlung bezahlt', icon: CreditCard },
      paid: { variant: 'default' as const, label: 'Bezahlt', icon: CheckCircle },
      refunded: { variant: 'destructive' as const, label: 'Rückerstattet', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const exportOrders = () => {
    const csvContent = [
      ['Bestell-ID', 'Kunde', 'E-Mail', 'Status', 'Zahlungsstatus', 'Gesamtbetrag', 'Datum'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.customer_name || '',
        order.customer_email || '',
        order.status,
        order.payment_status,
        order.total_amount,
        format(new Date(order.created_at), 'dd.MM.yyyy', { locale: de })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bestellungen_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Bestellverwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie alle Bestellungen und Zahlungen</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={exportOrders} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Suche nach Bestell-ID, Kundenname oder E-Mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="processing">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bestellungen ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Übersicht aller Bestellungen mit Status und Zahlungsinformationen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bestell-ID</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zahlung</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-center">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.customer_name || 'Unbekannt'}
                      </div>
                      {order.customer_email && (
                        <div className="text-sm text-muted-foreground">
                          {order.customer_email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(order.payment_status)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatSwissCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Bestellungen gefunden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bestelldetails</DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zur Bestellung
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bestell-ID</label>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Datum</label>
                  <p>{format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Zahlung</label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedOrder.payment_status)}</div>
                </div>
              </div>

              {/* Customer Info */}
              {(selectedOrder.customer_name || selectedOrder.customer_email) && (
                <div>
                  <h4 className="font-medium mb-2">Kundendaten</h4>
                  <div className="space-y-1">
                    {selectedOrder.customer_name && (
                      <p><User className="h-4 w-4 inline mr-2" />{selectedOrder.customer_name}</p>
                    )}
                    {selectedOrder.customer_email && (
                      <p><span className="text-muted-foreground">@</span>{selectedOrder.customer_email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Bestellte Produkte</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Menge: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatSwissCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Zwischensumme</span>
                    <span>{formatSwissCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MWST (7.7%)</span>
                    <span>{formatSwissCurrency(selectedOrder.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Gesamtbetrag</span>
                    <span>{formatSwissCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Select
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value as Order['status'])}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status ändern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Bestätigen</SelectItem>
                      <SelectItem value="processing">In Bearbeitung</SelectItem>
                      <SelectItem value="completed">Abschließen</SelectItem>
                      <SelectItem value="cancelled">Stornieren</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}