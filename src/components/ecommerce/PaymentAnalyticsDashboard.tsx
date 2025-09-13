/**
 * Payment Analytics Dashboard - Sprint C Week 10
 * Swiss payment compliance reporting and analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Smartphone,
  Building,
  Zap
} from 'lucide-react';
import { SwissPaymentService } from '@/services/api/swissPaymentService';
import { SwissVATService } from '@/services/api/ecommerceService';

interface PaymentAnalytics {
  total_transactions: number;
  total_amount: number;
  successful_transactions: number;
  failed_transactions: number;
  refunded_amount: number;
  payment_methods: Record<string, number>;
  vat_collected: number;
}

interface DailyStats {
  date: string;
  transactions: number;
  amount: number;
  successful_rate: number;
}

interface PaymentMethodStats {
  method: string;
  transactions: number;
  amount: number;
  success_rate: number;
  avg_amount: number;
}

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
];

export function PaymentAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<PaymentMethodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load payment statistics
      const stats = await SwissPaymentService.getPaymentStatistics(
        dateRange.from,
        dateRange.to
      );
      setAnalytics(stats);

      // Generate mock daily stats for visualization
      const mockDailyStats = generateMockDailyStats();
      setDailyStats(mockDailyStats);

      // Generate mock payment method stats
      const mockPaymentMethodStats = generateMockPaymentMethodStats(stats);
      setPaymentMethodStats(mockPaymentMethodStats);

    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Fehler beim Laden der Statistiken');
    } finally {
      setLoading(false);
    }
  };

  const generateMockDailyStats = (): DailyStats[] => {
    const stats: DailyStats[] = [];
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      stats.push({
        date: d.toISOString().split('T')[0],
        transactions: Math.floor(Math.random() * 50) + 10,
        amount: Math.floor(Math.random() * 5000) + 1000,
        successful_rate: 85 + Math.random() * 10,
      });
    }
    
    return stats;
  };

  const generateMockPaymentMethodStats = (analytics: PaymentAnalytics): PaymentMethodStats[] => {
    const methods = [
      { method: 'card', name: 'Kreditkarte', icon: CreditCard },
      { method: 'twint', name: 'TWINT', icon: Smartphone },
      { method: 'postfinance', name: 'PostFinance', icon: Building },
      { method: 'sofort', name: 'Sofort', icon: Zap },
    ];

    return methods.map((method) => ({
      method: method.name,
      transactions: Math.floor(Math.random() * 100) + 20,
      amount: Math.floor(Math.random() * 10000) + 2000,
      success_rate: 85 + Math.random() * 10,
      avg_amount: 45 + Math.random() * 50,
    }));
  };

  const exportReports = async () => {
    try {
      toast.success('Export wird vorbereitet...');
      // Implement PDF/Excel export functionality
    } catch (error) {
      toast.error('Fehler beim Export');
    }
  };

  const generateVATReport = async () => {
    try {
      toast.success('MwSt-Bericht wird erstellt...');
      // Implement Swiss VAT report generation
    } catch (error) {
      toast.error('Fehler beim Erstellen des MwSt-Berichts');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = analytics?.total_amount || 0;
  const successRate = analytics ? 
    (analytics.successful_transactions / Math.max(analytics.total_transactions, 1)) * 100 : 0;
  const avgTransactionValue = analytics?.successful_transactions ? 
    totalRevenue / analytics.successful_transactions : 0;

  const paymentMethodChartData = paymentMethodStats.map((stat) => ({
    name: stat.method,
    value: stat.transactions,
    amount: stat.amount,
  }));

  const dailyRevenueData = dailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString('de-CH', { month: 'short', day: 'numeric' }),
    amount: stat.amount,
    transactions: stat.transactions,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Zahlungsanalytik</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateVATReport}>
            <FileText className="h-4 w-4 mr-2" />
            MwSt-Bericht
          </Button>
          <Button variant="outline" onClick={exportReports}>
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Zeitraum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Von</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bis</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Schnellauswahl</Label>
              <Select onValueChange={(value) => {
                const today = new Date();
                let fromDate = new Date();
                
                switch (value) {
                  case '7d':
                    fromDate.setDate(today.getDate() - 7);
                    break;
                  case '30d':
                    fromDate.setDate(today.getDate() - 30);
                    break;
                  case '90d':
                    fromDate.setDate(today.getDate() - 90);
                    break;
                  case 'ytd':
                    fromDate = new Date(today.getFullYear(), 0, 1);
                    break;
                }
                
                setDateRange({
                  from: fromDate.toISOString().split('T')[0],
                  to: today.toISOString().split('T')[0],
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Zeitraum wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                  <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                  <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                  <SelectItem value="ytd">Jahr bis heute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {SwissVATService.formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% vs. Vormonat
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaktionen</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_transactions || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8.2% vs. Vormonat
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erfolgsquote</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.1% vs. Vormonat
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Transaktionswert</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {SwissVATService.formatCurrency(avgTransactionValue)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -3.2% vs. Vormonat
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Umsatzentwicklung</TabsTrigger>
          <TabsTrigger value="methods">Zahlungsarten</TabsTrigger>
          <TabsTrigger value="success">Erfolgsraten</TabsTrigger>
          <TabsTrigger value="vat">MwSt-Übersicht</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Täglicher Umsatz</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? SwissVATService.formatCurrency(value as number) : value,
                      name === 'amount' ? 'Umsatz' : 'Transaktionen'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaktionsvolumen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wochentage-Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day, index) => {
                    const value = 20 + Math.random() * 60;
                    return (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-20 text-sm">{day}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <div className="text-sm font-medium">{value.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Zahlungsarten-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zahlungsarten-Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {paymentMethodStats.map((stat, index) => (
                      <div key={stat.method} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium">{stat.method}</p>
                            <p className="text-sm text-muted-foreground">
                              {stat.transactions} Transaktionen
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{SwissVATService.formatCurrency(stat.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.success_rate.toFixed(1)}% Erfolgsquote
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Durchschnittliche Transaktionswerte</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="method" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [SwissVATService.formatCurrency(value as number), 'Ø Betrag']}
                  />
                  <Bar dataKey="avg_amount" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erfolgsraten nach Zahlungsart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={paymentMethodStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Erfolgsquote']} />
                  <Line
                    type="monotone"
                    dataKey="success_rate"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fehlgeschlagene Transaktionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Unzureichende Deckung</span>
                    <Badge variant="destructive">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Karte abgelehnt</span>
                    <Badge variant="destructive">28%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Technische Fehler</span>
                    <Badge variant="destructive">15%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Timeout</span>
                    <Badge variant="destructive">12%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rückerstattungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {SwissVATService.formatCurrency(analytics?.refunded_amount || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Gesamte Rückerstattungen</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Anzahl Rückerstattungen</span>
                    <Badge variant="outline">23</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ø Rückerstattungsbetrag</span>
                    <Badge variant="outline">
                      {SwissVATService.formatCurrency((analytics?.refunded_amount || 0) / 23)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vat" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>MwSt-Sammlung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {SwissVATService.formatCurrency(analytics?.vat_collected || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Gesammelte MwSt (7.7%)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nettoumsatz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {SwissVATService.formatCurrency(totalRevenue - (analytics?.vat_collected || 0))}
                  </div>
                  <p className="text-sm text-muted-foreground">Ohne MwSt</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MwSt-Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold">7.7%</div>
                  <p className="text-sm text-muted-foreground">Standard Schweizer MwSt</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monatliche MwSt-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [SwissVATService.formatCurrency(value as number * 0.077), 'MwSt']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PaymentAnalyticsDashboard;