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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User
} from 'lucide-react';
import { formatSwissCurrency } from '@/utils/swiss-formatting';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface PaymentManagementProps {
  refreshTrigger?: number;
}

interface PaymentRecord {
  id: string;
  payment_intent_id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  payment_method?: string;
  customer_email?: string;
  customer_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function PaymentManagement({ refreshTrigger }: PaymentManagementProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [refreshTrigger]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      // This would typically fetch from your payment service
      // For now, we'll use mock data
      const mockPayments: PaymentRecord[] = [
        {
          id: 'pay_1',
          payment_intent_id: 'pi_1234567890',
          order_id: 'order_123',
          amount: 125.50,
          currency: 'chf',
          status: 'succeeded',
          payment_method: 'card',
          customer_email: 'kunde@example.com',
          customer_name: 'Max Mustermann',
          description: 'Produktbestellung',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'pay_2',
          payment_intent_id: 'pi_0987654321',
          amount: 75.00,
          currency: 'chf',
          status: 'pending',
          payment_method: 'card',
          customer_email: 'anna@example.com',
          customer_name: 'Anna Schmidt',
          description: 'Terminanmeldung',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setPayments(mockPayments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_intent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    const statusConfig = {
      succeeded: { variant: 'default' as const, label: 'Erfolgreich', icon: CheckCircle, color: 'text-green-600' },
      pending: { variant: 'secondary' as const, label: 'Ausstehend', icon: Clock, color: 'text-yellow-600' },
      failed: { variant: 'destructive' as const, label: 'Fehlgeschlagen', icon: XCircle, color: 'text-red-600' },
      cancelled: { variant: 'destructive' as const, label: 'Storniert', icon: XCircle, color: 'text-red-600' },
      refunded: { variant: 'destructive' as const, label: 'Rückerstattet', icon: AlertTriangle, color: 'text-orange-600' },
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

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const exportPayments = () => {
    const csvContent = [
      ['Zahlungs-ID', 'Intent-ID', 'Bestell-ID', 'Betrag', 'Status', 'Methode', 'Kunde', 'E-Mail', 'Datum'].join(','),
      ...filteredPayments.map(payment => [
        payment.id,
        payment.payment_intent_id,
        payment.order_id || '',
        payment.amount,
        payment.status,
        payment.payment_method || '',
        payment.customer_name || '',
        payment.customer_email || '',
        format(new Date(payment.created_at), 'dd.MM.yyyy', { locale: de })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zahlungen_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateTotals = () => {
    const totalAmount = filteredPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = filteredPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const failedCount = filteredPayments.filter(p => p.status === 'failed').length;

    return { totalAmount, pendingAmount, failedCount };
  };

  const { totalAmount, pendingAmount, failedCount } = calculateTotals();

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
          <h2 className="text-3xl font-bold">Zahlungsverwaltung</h2>
          <p className="text-muted-foreground">Überwachen Sie alle Zahlungen und Transaktionen</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadPayments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button onClick={exportPayments} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamteinnahmen</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatSwissCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Erfolgreiche Zahlungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatSwissCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Wartende Zahlungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fehlgeschlagen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Zahlungen mit Fehlern
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Suche nach Zahlungs-ID, Intent-ID, Kundenname oder E-Mail..."
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
                <SelectItem value="succeeded">Erfolgreich</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
                <SelectItem value="refunded">Rückerstattet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Zahlungen ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Übersicht aller Zahlungstransaktionen mit Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zahlungs-ID</TableHead>
                <TableHead>Kunde</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Methode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-center">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">
                    {payment.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {payment.customer_name || 'Unbekannt'}
                      </div>
                      {payment.customer_email && (
                        <div className="text-sm text-muted-foreground">
                          {payment.customer_email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.payment_method)}
                      <span className="capitalize">{payment.payment_method || 'Unbekannt'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatSwissCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDetails(true);
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

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Zahlungen gefunden</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zahlungsdetails</DialogTitle>
            <DialogDescription>
              Detaillierte Informationen zur Zahlungstransaktion
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Zahlungs-ID</label>
                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stripe Intent-ID</label>
                  <p className="font-mono text-sm">{selectedPayment.payment_intent_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bestell-ID</label>
                  <p className="font-mono text-sm">{selectedPayment.order_id || 'Keine'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {/* Customer Info */}
              {(selectedPayment.customer_name || selectedPayment.customer_email) && (
                <div>
                  <h4 className="font-medium mb-2">Kundendaten</h4>
                  <div className="space-y-1">
                    {selectedPayment.customer_name && (
                      <p><User className="h-4 w-4 inline mr-2" />{selectedPayment.customer_name}</p>
                    )}
                    {selectedPayment.customer_email && (
                      <p><span className="text-muted-foreground">@</span>{selectedPayment.customer_email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div>
                <h4 className="font-medium mb-2">Zahlungsdetails</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Betrag</label>
                    <p className="text-lg font-semibold">{formatSwissCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Währung</label>
                    <p className="uppercase">{selectedPayment.currency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Zahlungsmethode</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentMethodIcon(selectedPayment.payment_method)}
                      <span className="capitalize">{selectedPayment.payment_method || 'Unbekannt'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Datum</label>
                    <p>{format(new Date(selectedPayment.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPayment.description && (
                <div>
                  <h4 className="font-medium mb-2">Beschreibung</h4>
                  <p className="text-muted-foreground">{selectedPayment.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedPayment.status === 'succeeded' && (
                  <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Rückerstatten
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowPaymentDetails(false)}>
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