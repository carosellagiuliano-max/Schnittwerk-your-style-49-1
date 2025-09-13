/**
 * Customer Segmentation Dashboard - Sprint C Week 12
 * Advanced customer insights and segmentation analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Star, 
  Calendar,
  ShoppingBag,
  Heart,
  Award,
  Target,
  Filter,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Gift,
  Percent,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  Pie, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import { financialService, type CustomerSegment } from '@/services/api/financialService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  segment: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  loyaltyStatus: string;
  lifetime_value: number;
  retention_probability: number;
  satisfaction_score: number;
  preferred_services: string[];
  marketing_consent: boolean;
}

interface SegmentationInsight {
  title: string;
  description: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CustomerSegmentationDashboard() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [insights, setInsights] = useState<SegmentationInsight[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('year');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [selectedTimeframe]);

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getTimeframeDates();
      const analytics = await financialService.getRevenueAnalytics(startDate, endDate);
      
      setSegments(analytics.customerSegments);
      setCustomers(generateMockCustomers());
      setInsights(generateInsights(analytics.customerSegments));
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframeDates = () => {
    const now = new Date();
    switch (selectedTimeframe) {
      case 'month':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          startDate: quarterStart.toISOString().split('T')[0],
          endDate: quarterEnd.toISOString().split('T')[0]
        };
      case 'year':
      default:
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        };
    }
  };

  const generateMockCustomers = (): CustomerProfile[] => {
    return [
      {
        id: '1',
        name: 'Maria Schneider',
        email: 'maria.schneider@email.ch',
        segment: 'VIP Kunden',
        totalSpent: 2850,
        visits: 18,
        lastVisit: '2024-01-15',
        loyaltyStatus: 'Diamant',
        lifetime_value: 4200,
        retention_probability: 0.95,
        satisfaction_score: 4.9,
        preferred_services: ['Schnitt + Föhnen', 'Färben + Schnitt'],
        marketing_consent: true
      },
      {
        id: '2',
        name: 'Stefan Müller',
        email: 'stefan.mueller@email.ch',
        segment: 'Stammkunden',
        totalSpent: 1650,
        visits: 12,
        lastVisit: '2024-01-12',
        loyaltyStatus: 'Gold',
        lifetime_value: 2100,
        retention_probability: 0.82,
        satisfaction_score: 4.7,
        preferred_services: ['Bart + Styling', 'Schnitt + Föhnen'],
        marketing_consent: true
      },
      {
        id: '3',
        name: 'Lisa Weber',
        email: 'lisa.weber@email.ch',
        segment: 'Gelegenheitskunden',
        totalSpent: 450,
        visits: 4,
        lastVisit: '2023-12-08',
        loyaltyStatus: 'Bronze',
        lifetime_value: 650,
        retention_probability: 0.45,
        satisfaction_score: 4.2,
        preferred_services: ['Waschen + Föhnen'],
        marketing_consent: false
      },
      {
        id: '4',
        name: 'Thomas Keller',
        email: 'thomas.keller@email.ch',
        segment: 'Neukunden',
        totalSpent: 180,
        visits: 2,
        lastVisit: '2024-01-20',
        loyaltyStatus: 'Neu',
        lifetime_value: 350,
        retention_probability: 0.65,
        satisfaction_score: 4.5,
        preferred_services: ['Schnitt + Föhnen'],
        marketing_consent: true
      }
    ];
  };

  const generateInsights = (segments: CustomerSegment[]): SegmentationInsight[] => {
    return [
      {
        title: 'VIP Kunden Potenzial',
        description: 'VIP Kunden generieren 45% mehr Umsatz pro Besuch',
        impact: '+CHF 12,500/Jahr',
        action: 'Premium Services ausbauen',
        priority: 'high'
      },
      {
        title: 'Retention Optimierung',
        description: 'Gelegenheitskunden haben 55% Abwanderungsrisiko',
        impact: '+15% Kundenbindung',
        action: 'Personalisierte Angebote entwickeln',
        priority: 'high'
      },
      {
        title: 'Neukunden Konversion',
        description: 'Nur 25% der Neukunden werden zu Stammkunden',
        impact: '+30% Conversion Rate',
        action: 'Onboarding-Prozess optimieren',
        priority: 'medium'
      },
      {
        title: 'Cross-Selling Potential',
        description: 'Stammkunden kaufen zu 65% auch Produkte',
        impact: '+CHF 8,200/Jahr',
        action: 'Produktempfehlungen implementieren',
        priority: 'medium'
      }
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'VIP Kunden':
        return <Award className="h-5 w-5 text-yellow-600" />;
      case 'Stammkunden':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'Gelegenheitskunden':
        return <Users className="h-5 w-5 text-gray-600" />;
      case 'Neukunden':
        return <Target className="h-5 w-5 text-green-600" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getLoyaltyBadgeColor = (status: string) => {
    switch (status) {
      case 'Diamant':
        return 'bg-purple-100 text-purple-800';
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Silber':
        return 'bg-gray-100 text-gray-800';
      case 'Bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredCustomers = selectedSegment === 'all' 
    ? customers 
    : customers.filter(c => c.segment === selectedSegment);

  // Customer value distribution data
  const valueDistributionData = customers.map(customer => ({
    name: customer.name.split(' ')[0],
    value: customer.totalSpent,
    visits: customer.visits,
    segment: customer.segment,
    retention: customer.retention_probability * 100
  }));

  // Segment performance comparison
  const segmentComparisonData = segments.map(segment => ({
    name: segment.segment_name,
    customers: segment.customer_count,
    totalValue: segment.total_value,
    avgValue: segment.average_value,
    retention: segment.retention_rate,
    growth: segment.growth_rate
  }));

  // Retention vs Value scatter
  const retentionValueData = customers.map(customer => ({
    x: customer.retention_probability * 100,
    y: customer.lifetime_value,
    z: customer.visits,
    name: customer.name,
    segment: customer.segment
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Segmentation</h1>
          <p className="text-gray-600">Erweiterte Kundenanalyse und Segmentierung</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Letzter Monat</SelectItem>
              <SelectItem value="quarter">Letztes Quartal</SelectItem>
              <SelectItem value="year">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Segment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {segments.map((segment, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setSelectedSegment(segment.segment_name)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{segment.segment_name}</CardTitle>
              {getSegmentIcon(segment.segment_name)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{segment.customer_count}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(segment.total_value)} Gesamtwert
              </p>
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                {segment.growth_rate > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={segment.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}>
                  {segment.growth_rate.toFixed(1)}%
                </span>
                <span className="ml-1">Wachstum</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Segment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kunden-Verteilung</CardTitle>
                <CardDescription>Verteilung nach Segmenten</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={segments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="customer_count"
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} Kunden`, name]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{segment.segment_name}</span>
                      </div>
                      <span className="text-sm font-medium">{segment.customer_count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Umsatz nach Segment</CardTitle>
                <CardDescription>Wertverteilung pro Kundengruppe</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalValue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Customer List with Filters */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Kundenliste</CardTitle>
                  <CardDescription>
                    {filteredCustomers.length} Kunden
                    {selectedSegment !== 'all' && ` im Segment "${selectedSegment}"`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Segment filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Segmente</SelectItem>
                      {segments.map(segment => (
                        <SelectItem key={segment.segment_name} value={segment.segment_name}>
                          {segment.segment_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="font-bold">{formatCurrency(customer.totalSpent)}</div>
                        <div className="text-xs text-gray-600">Ausgaben</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-bold">{customer.visits}</div>
                        <div className="text-xs text-gray-600">Besuche</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-bold">{customer.satisfaction_score}</span>
                        </div>
                        <div className="text-xs text-gray-600">Zufriedenheit</div>
                      </div>
                      
                      <div className="text-center">
                        <Badge className={getLoyaltyBadgeColor(customer.loyaltyStatus)}>
                          {customer.loyaltyStatus}
                        </Badge>
                      </div>

                      <div className="text-center">
                        <div className="font-bold">{(customer.retention_probability * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-600">Retention</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retention vs. Kundenwert</CardTitle>
                <CardDescription>Beziehung zwischen Bindung und Umsatz</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={retentionValueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Retention %" />
                    <YAxis dataKey="y" name="Lifetime Value" />
                    <ZAxis dataKey="z" range={[50, 200]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number, name: string) => [
                        name === 'x' ? `${value}%` : name === 'y' ? formatCurrency(value) : value,
                        name === 'x' ? 'Retention' : name === 'y' ? 'Lifetime Value' : 'Besuche'
                      ]}
                    />
                    <Scatter name="Kunden" dataKey="y" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Vergleich der Segmentleistung</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={segmentComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgValue" fill="#10b981" name="Ø Wert" />
                    <Bar dataKey="retention" fill="#f59e0b" name="Retention %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifetime Value</CardTitle>
                <CardDescription>Kundenwert-Analyse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Ø CLV</span>
                    <span className="font-bold">{formatCurrency(1875)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Top 20% CLV</span>
                    <span className="font-bold">{formatCurrency(4200)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CLV Wachstum</span>
                    <span className="font-bold text-green-600">+12.3%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      VIP Kunden haben 2.2x höheren CLV
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Analyse</CardTitle>
                <CardDescription>Abwanderungsrisiko</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Churn Rate</span>
                    <span className="font-bold text-red-600">8.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risiko-Kunden</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prävention ROI</span>
                    <span className="font-bold text-green-600">4.2x</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      12 Kunden benötigen sofortige Maßnahmen
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acquisition Metrics</CardTitle>
                <CardDescription>Neukundengewinnung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">CAC</span>
                    <span className="font-bold">{formatCurrency(45)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">LTV/CAC Ratio</span>
                    <span className="font-bold text-green-600">6.8:1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payback Zeit</span>
                    <span className="font-bold">2.1 Monate</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      Empfehlung: Budget um 30% erhöhen
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* AI-Generated Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <Card key={index} className={`border-l-4 ${
                insight.priority === 'high' ? 'border-l-red-500' : 
                insight.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <Badge variant={
                      insight.priority === 'high' ? 'destructive' : 
                      insight.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {insight.priority === 'high' ? 'Hoch' : 
                       insight.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </Badge>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Potentieller Impact:</span>
                      <span className="font-semibold text-green-600">{insight.impact}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-2">Empfohlene Aktion:</div>
                      <div className="text-sm text-gray-700">{insight.action}</div>
                    </div>
                    <Button size="sm" className="w-full">
                      Kampagne erstellen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Opportunity Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Matrix</CardTitle>
              <CardDescription>Segmente nach Potenzial und Aufwand priorisieren</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 h-96">
                {/* High Value, Low Effort */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">Quick Wins</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">VIP Cross-Selling</div>
                      <div className="text-sm text-gray-600">Produktempfehlungen für Top-Kunden</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Stammkunden Retention</div>
                      <div className="text-sm text-gray-600">Personalisierte Angebote</div>
                    </div>
                  </div>
                </div>

                {/* High Value, High Effort */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-3">Major Projects</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Neukunden Onboarding</div>
                      <div className="text-sm text-gray-600">Kompletter Einführungsprozess</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Churn Prävention</div>
                      <div className="text-sm text-gray-600">Predictive Analytics System</div>
                    </div>
                  </div>
                </div>

                {/* Low Value, Low Effort */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">Fill-ins</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Newsletter Optimierung</div>
                      <div className="text-sm text-gray-600">Content personalisieren</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium">Social Media Engagement</div>
                      <div className="text-sm text-gray-600">Organisches Wachstum</div>
                    </div>
                  </div>
                </div>

                {/* Low Value, High Effort */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Time Wasters</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border opacity-60">
                      <div className="font-medium">Massenmarketing</div>
                      <div className="text-sm text-gray-600">Ungezielte Kampagnen</div>
                    </div>
                    <div className="bg-white p-3 rounded border opacity-60">
                      <div className="font-medium">Rabatt-Schlachten</div>
                      <div className="text-sm text-gray-600">Preiskampf vermeiden</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaign Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Empfohlene Kampagnen</CardTitle>
                <CardDescription>Basierend auf Segmentanalyse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">VIP Produktlaunch</div>
                    <Badge variant="default">Bereit</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Exklusiver Vorab-Zugang zu neuen Premium Services für VIP Kunden
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zielgruppe: 45 Kunden</span>
                    <span>Erwarteter ROI: 450%</span>
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    <Mail className="h-4 w-4 mr-2" />
                    Kampagne starten
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">Win-Back Kampagne</div>
                    <Badge variant="secondary">Geplant</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Personalisierte Angebote für Kunden mit hohem Churn-Risiko
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zielgruppe: 23 Kunden</span>
                    <span>Erwarteter ROI: 320%</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    <Clock className="h-4 w-4 mr-2" />
                    Für später planen
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">Neukunden Willkommen</div>
                    <Badge variant="outline">Entwurf</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Onboarding-Serie für neue Kunden mit Loyalty-Programm
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zielgruppe: Alle Neukunden</span>
                    <span>Erwarteter ROI: 280%</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    <Activity className="h-4 w-4 mr-2" />
                    Ausarbeiten
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kampagnen Performance</CardTitle>
                <CardDescription>Laufende und abgeschlossene Kampagnen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">Frühjahrs-Aktion</div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">Abgeschlossen</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Öffnungsrate</div>
                        <div className="font-bold">68.5%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Conversion</div>
                        <div className="font-bold">15.2%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">ROI</div>
                        <div className="font-bold text-green-600">425%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Umsatz</div>
                        <div className="font-bold">{formatCurrency(8500)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">Stammkunden Bonus</div>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-sm text-blue-600">Laufend</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Öffnungsrate</div>
                        <div className="font-bold">72.1%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Klicks</div>
                        <div className="font-bold">23.8%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Laufzeit</div>
                        <div className="font-bold">5 Tage</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Erste Ergebnisse</div>
                        <div className="font-bold">{formatCurrency(2100)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Nächste Schritte:</div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Target className="h-4 w-4 text-blue-600 mr-2" />
                      <span>A/B Test für VIP Kampagne vorbereiten</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MessageSquare className="h-4 w-4 text-green-600 mr-2" />
                      <span>Feedback-Umfrage für Stammkunden</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Gift className="h-4 w-4 text-purple-600 mr-2" />
                      <span>Loyalty-Programm erweitern</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Kampagne erstellen</CardTitle>
              <CardDescription>Neue zielgerichtete Marketing-Kampagne</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Kampagnen Name</Label>
                    <Input id="campaign-name" placeholder="z.B. Sommer Special 2024" />
                  </div>
                  
                  <div>
                    <Label htmlFor="target-segment">Zielgruppe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Segment auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip">VIP Kunden</SelectItem>
                        <SelectItem value="regular">Stammkunden</SelectItem>
                        <SelectItem value="occasional">Gelegenheitskunden</SelectItem>
                        <SelectItem value="new">Neukunden</SelectItem>
                        <SelectItem value="at-risk">Risiko-Kunden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="campaign-type">Kampagnen Typ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">E-Mail Marketing</SelectItem>
                        <SelectItem value="sms">SMS Kampagne</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                        <SelectItem value="direct">Direktmailing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="offer-type">Angebot</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Angebot auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Rabatt (%)</SelectItem>
                        <SelectItem value="fixed">Fester Betrag</SelectItem>
                        <SelectItem value="bogo">Buy-One-Get-One</SelectItem>
                        <SelectItem value="upgrade">Service Upgrade</SelectItem>
                        <SelectItem value="loyalty">Loyalty Punkte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="offer-value">Angebotswert</Label>
                    <Input id="offer-value" placeholder="z.B. 20 oder CHF 50" />
                  </div>

                  <div className="flex space-x-2">
                    <Button className="flex-1">
                      <Activity className="h-4 w-4 mr-2" />
                      Vorschau
                    </Button>
                    <Button className="flex-1" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Erwartete Ergebnisse:</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Zielgruppe</div>
                    <div className="font-bold">156 Kunden</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Erwartete Conversion</div>
                    <div className="font-bold">18.5%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Geschätzter Umsatz</div>
                    <div className="font-bold">{formatCurrency(4200)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}