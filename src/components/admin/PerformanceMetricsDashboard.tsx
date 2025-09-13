/**
 * Performance Metrics Dashboard - Sprint C Week 12
 * Real-time KPI tracking and business performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity,
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Gauge,
  Award,
  Star,
  ThumbsUp,
  Timer,
  Percent
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { financialService } from '@/services/api/financialService';

interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ElementType;
  color: string;
}

interface PerformanceAlert {
  id: string;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
}

export default function PerformanceMetricsDashboard() {
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadPerformanceData();
    startRealtimeUpdates();

    return () => stopRealtimeUpdates();
  }, [selectedPeriod]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const analytics = await financialService.getRevenueAnalytics(startDate, endDate);
      
      setKPIs(generateKPIs(analytics));
      setAlerts(generateAlerts());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRealtimeUpdates = () => {
    const interval = setInterval(() => {
      updateRealtimeMetrics();
    }, 30000);

    return () => clearInterval(interval);
  };

  const stopRealtimeUpdates = () => {
    // Cleanup
  };

  const updateRealtimeMetrics = () => {
    setRealtimeData({
      currentRevenue: Math.floor(Math.random() * 3000) + 2000,
      activeBookings: Math.floor(Math.random() * 20) + 10,
      staffUtilization: Math.floor(Math.random() * 15) + 80,
      customerSatisfaction: (Math.random() * 0.4 + 4.6).toFixed(1),
      waitingListLength: Math.floor(Math.random() * 10) + 5,
      conversionRate: (Math.random() * 5 + 15).toFixed(1),
      averageServiceTime: Math.floor(Math.random() * 15) + 75,
      noShowRate: (Math.random() * 3 + 2).toFixed(1)
    });
    setLastUpdated(new Date());
  };

  const getPeriodDates = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
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
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        };
    }
  };

  const generateKPIs = (analytics: any): KPI[] => {
    return [
      {
        id: 'revenue',
        name: 'Umsatz',
        value: realtimeData?.currentRevenue || 125400,
        target: 120000,
        unit: 'CHF',
        trend: 12.5,
        status: 'excellent',
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        id: 'bookings',
        name: 'Buchungsrate',
        value: parseFloat(realtimeData?.conversionRate || '18.5'),
        target: 15,
        unit: '%',
        trend: 8.2,
        status: 'excellent',
        icon: Calendar,
        color: 'text-blue-600'
      },
      {
        id: 'satisfaction',
        name: 'Kundenzufriedenheit',
        value: parseFloat(realtimeData?.customerSatisfaction || '4.7'),
        target: 4.5,
        unit: '/5',
        trend: 2.1,
        status: 'good',
        icon: Star,
        color: 'text-yellow-600'
      },
      {
        id: 'utilization',
        name: 'Auslastung',
        value: realtimeData?.staffUtilization || 87,
        target: 85,
        unit: '%',
        trend: 5.3,
        status: 'good',
        icon: Users,
        color: 'text-purple-600'
      },
      {
        id: 'efficiency',
        name: 'Effizienz',
        value: realtimeData?.averageServiceTime || 85,
        target: 90,
        unit: 'min',
        trend: -3.2,
        status: 'warning',
        icon: Clock,
        color: 'text-orange-600'
      },
      {
        id: 'retention',
        name: 'Kundenbindung',
        value: 78.5,
        target: 75,
        unit: '%',
        trend: 4.8,
        status: 'good',
        icon: ThumbsUp,
        color: 'text-green-600'
      },
      {
        id: 'growth',
        name: 'Wachstum',
        value: 15.8,
        target: 12,
        unit: '%',
        trend: 22.1,
        status: 'excellent',
        icon: TrendingUp,
        color: 'text-emerald-600'
      },
      {
        id: 'noshow',
        name: 'No-Show Rate',
        value: parseFloat(realtimeData?.noShowRate || '3.2'),
        target: 5,
        unit: '%',
        trend: -12.5,
        status: 'good',
        icon: AlertTriangle,
        color: 'text-red-600'
      }
    ];
  };

  const generateAlerts = (): PerformanceAlert[] => {
    return [
      {
        id: '1',
        type: 'success',
        title: 'Ziel erreicht',
        message: 'Monatsumsatz-Ziel bereits zu 104% erreicht',
        timestamp: '2024-01-21 14:30',
        action: 'Details anzeigen'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Auslastung hoch',
        message: 'Mitarbeiter-Auslastung über 90% - zusätzliche Pausen empfohlen',
        timestamp: '2024-01-21 13:15',
        action: 'Schichten anpassen'
      },
      {
        id: '3',
        type: 'success',
        title: 'Neue Bewertung',
        message: 'Kundenzufriedenheit auf 4.8/5 gestiegen',
        timestamp: '2024-01-21 12:45'
      },
      {
        id: '4',
        type: 'warning',
        title: 'Warteliste voll',
        message: 'Warteliste für kommende Woche zu 85% gefüllt',
        timestamp: '2024-01-21 11:20',
        action: 'Kapazität prüfen'
      }
    ];
  };

  const formatValue = (kpi: KPI) => {
    const formatted = kpi.unit === 'CHF' 
      ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(kpi.value)
      : `${kpi.value}${kpi.unit}`;
    return formatted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-blue-600" />;
    }
  };

  // Performance trend data
  const performanceTrendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }),
      revenue: Math.floor(Math.random() * 1000) + 1500,
      bookings: Math.floor(Math.random() * 15) + 10,
      satisfaction: (Math.random() * 0.5 + 4.5).toFixed(1),
      utilization: Math.floor(Math.random() * 20) + 75
    };
  });

  // Real-time KPI gauge data
  const gaugeData = kpis.slice(0, 4).map(kpi => ({
    name: kpi.name,
    value: kpi.unit === 'CHF' ? (kpi.value / kpi.target) * 100 : kpi.value,
    target: kpi.unit === 'CHF' ? 100 : kpi.target,
    fill: kpi.status === 'excellent' ? '#10b981' : kpi.status === 'good' ? '#3b82f6' : '#f59e0b'
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600">
            Real-time KPI Überwachung • Letzte Aktualisierung: {lastUpdated.toLocaleTimeString('de-CH')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 Tage</SelectItem>
              <SelectItem value="month">30 Tage</SelectItem>
              <SelectItem value="quarter">Quartal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadPerformanceData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Bericht
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Live Benachrichtigungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-600">{alert.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{alert.timestamp.split(' ')[1]}</span>
                    {alert.action && (
                      <Button size="sm" variant="outline">
                        {alert.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className={`border-l-4 ${getStatusColor(kpi.status)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(kpi)}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted-foreground">
                  Ziel: {kpi.unit === 'CHF' ? formatValue({...kpi, value: kpi.target}) : `${kpi.target}${kpi.unit}`}
                </div>
                <div className="flex items-center text-xs">
                  {kpi.trend > 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      kpi.status === 'excellent' ? 'bg-green-600' : 
                      kpi.status === 'good' ? 'bg-blue-600' : 
                      kpi.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ 
                      width: `${Math.min(100, kpi.unit === 'CHF' ? (kpi.value / kpi.target) * 100 : 
                                         kpi.unit === '%' ? kpi.value : (kpi.value / kpi.target) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="targets">Ziele</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend (30 Tage)</CardTitle>
                <CardDescription>Entwicklung der wichtigsten Metriken</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KPI Zielerreichung</CardTitle>
                <CardDescription>Fortschritt gegenüber den gesetzten Zielen</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={gaugeData}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operative Exzellenz</CardTitle>
                <CardDescription>Betriebseffizienz-Metriken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Durchschnittliche Servicezeit</span>
                    <span className="font-bold">{realtimeData?.averageServiceTime || 85} min</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Terminpünktlichkeit</span>
                    <span className="font-bold">96.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '96.5%' }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Qualitätsstandard</span>
                    <span className="font-bold">98.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.2%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kundenerfahrung</CardTitle>
                <CardDescription>Customer Experience Metriken</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{realtimeData?.customerSatisfaction || '4.7'}</div>
                    <div className="text-sm text-gray-600">Kundenzufriedenheit</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weiterempfehlungsrate</span>
                      <span className="font-medium">92.1%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Wiederholungsrate</span>
                      <span className="font-medium">78.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Erste Eindruck</span>
                      <span className="font-medium">95.8%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trend</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Steigend
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geschäftswachstum</CardTitle>
                <CardDescription>Wachstums-Indikatoren</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monatswachstum</span>
                    <span className="font-bold text-green-600">+15.8%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Neukunden</span>
                    <span className="font-bold">+24.3%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Umsatz pro Kunde</span>
                    <span className="font-bold">+8.7%</span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">CHF 125.4K</div>
                      <div className="text-sm text-gray-600">Monatsumsatz</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          {/* Real-time Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Heute Umsatz</p>
                    <p className="text-2xl font-bold">{new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(realtimeData?.currentRevenue || 2150)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
                <div className="mt-2 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+18.2% vs. gestern</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Aktive Termine</p>
                    <p className="text-2xl font-bold">{realtimeData?.activeBookings || 12}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-200" />
                </div>
                <div className="mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">3 in der nächsten Stunde</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Team Auslastung</p>
                    <p className="text-2xl font-bold">{realtimeData?.staffUtilization || 87}%</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
                <div className="mt-2 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  <span className="text-sm">4 Mitarbeiter aktiv</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Warteliste</p>
                    <p className="text-2xl font-bold">{realtimeData?.waitingListLength || 6}</p>
                  </div>
                  <Timer className="h-8 w-8 text-orange-200" />
                </div>
                <div className="mt-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">2 heute konvertiert</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Live Performance Monitor</CardTitle>
              <CardDescription>Echtzeit-Metriken der letzten 24 Stunden</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceTrendData.slice(-24)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="bookings" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Real-time Status Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Aktueller Betriebsstatus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span>Buchungssystem</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span>Zahlungsverarbeitung</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Aktiv</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span>E-Mail Benachrichtigungen</span>
                    </div>
                    <Badge variant="secondary">Verzögert</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span>Mobile App</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">Verfügbar</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Aktivitäten</CardTitle>
                <CardDescription>Live-Feed der Geschäftsaktivitäten</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">14:23</span>
                    <span>Termin bestätigt - Maria S.</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">14:18</span>
                    <span>Neue Buchung - Thomas K.</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">14:15</span>
                    <span>Zahlung erhalten - CHF 180</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">14:12</span>
                    <span>Warteliste Konversion - Lisa W.</span>
                  </div>

                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">14:08</span>
                    <span>5-Sterne Bewertung erhalten</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Langzeit-Entwicklung der wichtigsten Kennzahlen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Umsatz" />
                  <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} name="Buchungen" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#f59e0b" strokeWidth={2} name="Zufriedenheit" />
                  <Line type="monotone" dataKey="utilization" stroke="#ef4444" strokeWidth={2} name="Auslastung" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aufwärtstrends</CardTitle>
                <CardDescription>Positive Entwicklungen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">Kundenzufriedenheit</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+12.5%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">Buchungsrate</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+8.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">Umsatz pro Kunde</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">+15.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stabile Metriken</CardTitle>
                <CardDescription>Gleichbleibende Leistung</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm">Mitarbeiter Auslastung</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">87%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm">Servicequalität</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">4.7/5</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm">Terminpünktlichkeit</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">96%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verbesserungsbereiche</CardTitle>
                <CardDescription>Optimierungspotenzial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm">Wartezeiten</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600">-3.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm">No-Show Rate</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">3.2%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm">Online Conversion</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">-1.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          {/* Target vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ziel-Performance</CardTitle>
                <CardDescription>Aktuelle Leistung vs. gesetzte Ziele</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpis.slice(0, 6).map((kpi) => (
                    <div key={kpi.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{formatValue(kpi)}</span>
                          <span className="text-xs text-gray-500">
                            / {kpi.unit === 'CHF' ? formatValue({...kpi, value: kpi.target}) : `${kpi.target}${kpi.unit}`}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            kpi.status === 'excellent' ? 'bg-green-600' : 
                            kpi.status === 'good' ? 'bg-blue-600' : 
                            kpi.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ 
                            width: `${Math.min(100, kpi.unit === 'CHF' ? (kpi.value / kpi.target) * 100 : 
                                               kpi.unit === '%' ? kpi.value : (kpi.value / kpi.target) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quartals-Ziele</CardTitle>
                <CardDescription>Fortschritt der Quartalsziele</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">78%</div>
                    <div className="text-sm text-gray-600">Quartals-Fortschritt</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Umsatzziel Q1</span>
                      <span className="font-medium">CHF 375K</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Kundenziele</span>
                      <span className="font-medium">850 Kunden</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Zufriedenheitsziel</span>
                      <span className="font-medium">4.5/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Setting */}
          <Card>
            <CardHeader>
              <CardTitle>Ziele verwalten</CardTitle>
              <CardDescription>Neue Ziele setzen und bestehende anpassen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Aktuelle Monatsziele</h3>
                  <div className="space-y-3">
                    {[
                      { metric: 'Umsatz', current: 'CHF 125K', target: 'CHF 120K', status: 'exceeded' },
                      { metric: 'Buchungen', current: '18.5%', target: '15%', status: 'exceeded' },
                      { metric: 'Zufriedenheit', current: '4.7/5', target: '4.5/5', status: 'met' },
                      { metric: 'Auslastung', current: '87%', target: '85%', status: 'met' }
                    ].map((goal, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{goal.metric}</div>
                          <div className="text-sm text-gray-600">{goal.current} / {goal.target}</div>
                        </div>
                        <Badge variant={goal.status === 'exceeded' ? 'default' : 'secondary'}>
                          {goal.status === 'exceeded' ? 'Übertroffen' : 'Erreicht'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Empfehlungen</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center mb-2">
                        <Target className="h-4 w-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Umsatzziel erhöhen</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Aktuelle Performance übertrifft Ziel um 4.2%. Empfehlung: Ziel auf CHF 130K erhöhen.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Qualitätsziel anpassen</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Kundenzufriedenheit konstant über 4.7. Neues Ziel von 4.8 wäre erreichbar.
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="font-medium text-yellow-800">Effizienz fokussieren</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Servicezeiten-Optimierung könnte Kapazität um 12% erhöhen.
                      </p>
                    </div>
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