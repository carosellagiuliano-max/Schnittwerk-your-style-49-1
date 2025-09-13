import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Download,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Clock,
  AlertTriangle,
  Send,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts';
import { financialService, type FinancialSummary, type DailyFinancialReport, type RevenueAnalytics } from '@/services/api/financialService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function FinancialOverview() {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  const generatePDF = () => {
    // Simulate PDF generation
    const content = `
FINANZÜBERSICHT ${selectedYear}
==========================

GESAMTUMSATZ: CHF ${currentYearData.totalRevenue.toLocaleString()}
TERMINE TOTAL: ${currentYearData.totalAppointments}
DURCHSCHNITT PRO TERMIN: CHF ${currentYearData.averagePerAppointment}
NEUKUNDEN: ${currentYearData.newCustomers}

MONATLICHE AUFSCHLÜSSELUNG:
${monthlyData.map(m => `${m.month}: CHF ${m.revenue.toLocaleString()} (${m.appointments} Termine)`).join('\n')}

SERVICE BREAKDOWN:
${serviceBreakdown.map(s => `${s.service}: CHF ${s.revenue.toLocaleString()} (${s.percentage}%)`).join('\n')}

---
Generiert am: ${new Date().toLocaleDateString('de-CH')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finanzuebersicht_${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentData = () => {
    switch (timePeriod) {
      case 'day': return dailyData;
      case 'week': return weeklyData;
      case 'month': return monthlyData;
      case 'year': return yearlyData;
      default: return monthlyData;
    }
  };

  const handleBarClick = (data: any) => {
    setSelectedDataPoint(data);
    setShowDetailModal(true);
  };
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0
    };
  };

  const revenueChange = calculateChange(currentYearData.totalRevenue, previousYearData.totalRevenue);
  const appointmentChange = calculateChange(currentYearData.totalAppointments, previousYearData.totalAppointments);
  const avgChange = calculateChange(currentYearData.averagePerAppointment, previousYearData.averagePerAppointment);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Time Period Selection and PDF Export */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Finanzübersicht {selectedYear}</h2>
          <p className="text-muted-foreground">Detaillierte Analyse mit Warteschlangen-Performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Period Selection */}
          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
            {[
              { value: 'day', label: 'Tag' },
              { value: 'week', label: 'Woche' },
              { value: 'month', label: 'Monat' },
              { value: 'year', label: 'Jahr' }
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={timePeriod === value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimePeriod(value as any)}
              >
                {label}
              </Button>
            ))}
          </div>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generatePDF} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            PDF Export
          </Button>
        </div>
      </div>

      {/* Enhanced Key Metrics with Better Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Gesamtumsatz</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              CHF {currentYearData.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-600 font-medium">
                +{revenueChange.value}% vs. Vorjahr
              </span>
            </div>
            <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-700">
              Warteschlange: +14 Termine
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Termine Total</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {currentYearData.totalAppointments}
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">
                +{appointmentChange.value}% vs. Vorjahr
              </span>
            </div>
            <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">
              Aus Warteschlange: 89
            </Badge>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Ø pro Termin</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              CHF {currentYearData.averagePerAppointment}
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-purple-600 font-medium">
                +{avgChange.value}% vs. Vorjahr
              </span>
            </div>
            <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700">
              Tool Performance: +23%
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Neukunden</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {currentYearData.newCustomers}
            </div>
            <div className="flex items-center gap-1 text-sm mt-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600 font-medium">
                +{currentYearData.newCustomers - previousYearData.newCustomers} vs. Vorjahr
              </span>
            </div>
            <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700">
              Via Warteschlange: 67
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="day">Tagesansicht</TabsTrigger>
          <TabsTrigger value="week">Wochenansicht</TabsTrigger>
          <TabsTrigger value="month">Monatsansicht</TabsTrigger>
          <TabsTrigger value="year">Jahresansicht</TabsTrigger>
        </TabsList>


        <TabsContent value="day">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Täglicher Umsatz - Diese Woche
                </span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `CHF ${value}` : value,
                      name === 'revenue' ? 'Umsatz' : 'Termine'
                    ]}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={handleBarClick}
                  />
                  <Bar 
                    dataKey="appointments" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={handleBarClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Wöchentlicher Umsatz - Aktueller Monat
                </span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? `CHF ${value}` : value,
                      name === 'revenue' ? 'Umsatz' : name === 'appointments' ? 'Termine' : 'Warteschlange Buchungen'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                  <Bar dataKey="waitingListBookings" fill="#f59e0b" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span>Umsatz</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Termine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded" />
                  <span>Warteschlange → Buchung</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monatlicher Umsatz {selectedYear}
                </span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `CHF ${value}` : value,
                    name === 'revenue' ? 'Umsatz' : 'Termine'
                  ]} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="year">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Jährliche Entwicklung
                </span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `CHF ${value}` : value,
                    name === 'revenue' ? 'Umsatz' : 'Termine'
                  ]} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Breakdown with Enhanced Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Service Performance & Warteschlangen-Erfolg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Umsatz nach Service</h4>
              {serviceBreakdown.map((service, index) => (
                <div key={service.service} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="text-sm font-medium min-w-[140px]">
                      {service.service}
                    </div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${service.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="text-sm font-semibold text-emerald-600">
                      CHF {service.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Tool-Performance Highlights</h4>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-sm font-medium text-emerald-800">Warteschlangen-System</div>
                  <div className="text-xs text-emerald-600 mt-1">89 erfolgreiche Buchungen (+156% vs. Vorjahr)</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Automatische Benachrichtigungen</div>
                  <div className="text-xs text-blue-600 mt-1">98% Erfolgsrate bei Kundenanrufen</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-sm font-medium text-purple-800">Gender-basierte Terminierung</div>
                  <div className="text-xs text-purple-600 mt-1">Optimierte Zeitplanung reduziert Wartezeiten um 23%</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-sm font-medium text-amber-800">PDF-Export für Steuern</div>
                  <div className="text-xs text-amber-600 mt-1">Vollständige Compliance & 1-Klick Export</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedDataPoint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Detailansicht</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Umsatz</label>
                  <p className="text-2xl font-bold text-emerald-600">CHF {selectedDataPoint.revenue}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Termine</label>
                  <p className="text-2xl font-bold text-blue-600">{selectedDataPoint.appointments}</p>
                </div>
              </div>
              {selectedDataPoint.waitingListBookings && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warteschlange → Buchungen</label>
                  <p className="text-xl font-bold text-amber-600">{selectedDataPoint.waitingListBookings}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowDetailModal(false)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}