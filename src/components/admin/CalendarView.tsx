import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, Scissors, Search, Filter, Plus, ChevronLeft, ChevronRight, Phone, Mail, CalendarDays, Grid3X3, Layout, Maximize2 } from 'lucide-react';
import { AppointmentBookingDialog } from '@/components/booking/appointment-booking-dialog';
import { AddCustomerModal } from './AddCustomerModal';
import { apiService, type Appointment } from '@/services/api';

// Staff interface for extended data
interface Staff {
  id: string;
  name: string;
  color: string;
}

// Extended appointment interface with calculated fields
interface ExtendedAppointment extends Appointment {
  customer_name?: string;
  service_name?: string;
  staff_name?: string;
}

// Waiting list interface
interface WaitingListEntry {
  id: string;
  name: string;
  gender: string;
  phone?: string;
  email?: string;
  preferredService: string;
  preferredDate: string;
  preferredTime: string;
  waitingSince: string;
  flexible: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function CalendarView() {
  // State management
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateString, setSelectedDateString] = useState('2024-01-15');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [isCompactView, setIsCompactView] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showNeonNotification, setShowNeonNotification] = useState(false);
  const [neonNotificationData, setNeonNotificationData] = useState<any>(null);

  // Load data from API service
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load appointments and calculate extended data
        // TODO: In Sprint B, this will load real appointment data
        const appointmentData = await apiService.getAppointments();
        const extendedAppointments: ExtendedAppointment[] = appointmentData.map((apt, index) => ({
          ...apt,
          customer_name: `Kunde ${index + 1}`, // Mock customer name
          service_name: `Service ${index + 1}`, // Mock service name  
          staff_name: `Mitarbeiter ${index + 1}`, // Mock staff name
        }));
        
        setAppointments(extendedAppointments);
        
        // Mock staff data - will be replaced with real data in Sprint B
        setStaff([
          { id: 'all', name: 'Alle Mitarbeiter', color: 'bg-gray-100' },
          { id: 'vanessa', name: 'Vanessa (Inhaberin)', color: 'bg-pink-100' },
          { id: 'marco', name: 'Marco (Stylist)', color: 'bg-blue-100' },
          { id: 'sarah', name: 'Sarah (Assistentin)', color: 'bg-green-100' }
        ]);
        
        // Mock waiting list data - will be replaced with real data in Sprint B
        setWaitingList([
          {
            id: '1',
            name: 'Thomas Wagner',
            gender: 'male',
            phone: '+41 79 123 45 67',
            email: 'thomas.wagner@email.com',
            preferredService: 'Schnitt + Föhnen',
            preferredDate: '2024-01-15',
            preferredTime: '14:00',
            waitingSince: '2024-01-10',
            flexible: true,
            priority: 'high'
          },
          {
            id: '2',
            name: 'Julia Meier',
            gender: 'female',
            phone: '+41 78 987 65 43',
            email: 'julia.meier@email.com',
            preferredService: 'Komplett Service',
            preferredDate: '2024-01-16',
            preferredTime: '10:00',
            waitingSince: '2024-01-12',
            flexible: false,
            priority: 'medium'
          }
        ]);
        
      } catch (err) {
        console.error('Failed to load calendar data:', err);
        setError('Fehler beim Laden der Kalenderdaten. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    switch (viewType) {
      case 'day':
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        currentDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    setSelectedDate(currentDate);
    setSelectedDateString(currentDate.toISOString().split('T')[0]);
  };

  const formatDateRange = () => {
    const date = new Date(selectedDate);
    switch (viewType) {
      case 'day':
        return date.toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return '';
    }
  };

  const handleContactCustomer = (customer: any, type: 'phone' | 'email') => {
    if (type === 'phone') {
      window.open(`tel:${customer.phone}`);
    } else {
      window.open(`mailto:${customer.email}?subject=Terminbestätigung&body=Liebe/r ${customer.name}, wir haben einen freien Termin für Sie.`);
    }
  };

  const getGenderColor = (gender: string) => {
    return gender === 'female' 
      ? 'bg-pink-100 border-pink-300 text-pink-800' 
      : 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const getWaitingListGenderColor = (gender: string) => {
    return gender === 'female' 
      ? 'border-l-pink-500 bg-gradient-to-r from-pink-50 to-pink-100/50' 
      : 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const simulateWaitingListNotification = (customer: any) => {
    setNeonNotificationData(customer);
    setShowNeonNotification(true);
    // Auto-hide after 10 seconds
    setTimeout(() => setShowNeonNotification(false), 10000);
  };

  const bookFromWaitingList = (customer: any) => {
    // Show neon notification first
    simulateWaitingListNotification(customer);
    // Then open booking dialog with special color indication
    setTimeout(() => setShowBookingDialog(true), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bestätigt':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleQuickBook = () => {
    setShowBookingDialog(true);
  };

  // Filter appointments based on selected employee
  const filteredAppointments = selectedEmployee === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.staff_id === selectedEmployee);

  const getEmployeeColor = (employeeId: string) => {
    const employee = staff.find(emp => emp.id === employeeId);
    return employee?.color || 'bg-gray-100';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Kalender wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Terminkalender</h2>
          <p className="text-muted-foreground">Professionelle Terminverwaltung</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleQuickBook} className="gap-2">
            <Plus className="w-4 h-4" />
            Neuer Termin
          </Button>
          <Button onClick={() => setShowNewCustomerModal(true)} variant="outline" className="gap-2">
            <User className="w-4 h-4" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Termine heute</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtzeit</p>
                <p className="text-2xl font-bold">7h 25min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warteschlange</p>
                <p className="text-2xl font-bold">{waitingList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Scissors className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Umsatz heute</p>
                <p className="text-2xl font-bold">CHF 370</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar and Waiting List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="waiting" className="gap-2">
            <Clock className="w-4 h-4" />
            Warteschlange ({waitingList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          {/* Employee Filter and Time Period Selection */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Mitarbeiter:</span>
                  </div>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${employee.color} border`}></div>
                            {employee.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {staff.slice(1).map((employee) => (
                      <div key={employee.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${employee.color} border`}></div>
                        <span className="text-xs">{employee.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                  {[
                    { value: 'day', icon: Calendar, label: 'Tag' },
                    { value: 'week', icon: CalendarDays, label: 'Woche' },
                    { value: 'month', icon: Grid3X3, label: 'Monat' },
                    { value: 'year', icon: Layout, label: 'Jahr' }
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={viewType === value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewType(value as any)}
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Button>
                  ))}
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold">{formatDateRange()}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee === 'all' ? 'Alle Mitarbeiter' : staff.find(emp => emp.id === selectedEmployee)?.name} - {viewType.charAt(0).toUpperCase() + viewType.slice(1)}ansicht
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{viewType.charAt(0).toUpperCase() + viewType.slice(1)}übersicht - {formatDateRange()}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded"></div>
                  Gebucht
                  <div className="w-3 h-3 bg-background border border-dashed border-border rounded ml-4"></div>
                  Verfügbar
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className={isCompactView ? "p-2" : "p-6"}>
              <div className="grid grid-cols-8 gap-1">
                {/* Time Column */}
                <div className="space-y-2">
                  <div className={`${isCompactView ? 'h-8' : 'h-12'} flex items-center justify-center font-semibold text-sm bg-muted/30 rounded`}>
                    Zeit
                  </div>
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className={`${isCompactView ? 'h-12' : 'h-16'} flex items-center justify-center text-sm text-muted-foreground border-r border-border/50`}>
                      {String(9 + i).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, dayIndex) => (
                  <div key={day} className="space-y-2">
                    <div className={`${isCompactView ? 'h-8' : 'h-12'} flex items-center justify-center font-semibold bg-muted/50 rounded-lg border`}>
                      <div className="text-center">
                        <div className="text-sm font-medium">{day}</div>
                        <div className="text-xs text-muted-foreground">{15 + dayIndex}.01</div>
                      </div>
                    </div>
                    
                    {/* Time Slots */}
                    {Array.from({ length: 12 }, (_, timeIndex) => {
                      // For now, using mock appointment logic since real appointment scheduling 
                      // will be implemented in Sprint B
                      const timeSlot = `${(9 + timeIndex).toString().padStart(2, '0')}:00`;
                      const hasAppointment = filteredAppointments.find(apt => 
                        apt.start_time === timeSlot && 
                        dayIndex < 5 // Only weekdays have appointments
                      );
                      
                      return (
                        <div
                          key={timeIndex}
                           className={`${isCompactView ? 'h-12' : 'h-16'} rounded border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group relative ${
                             hasAppointment 
                               ? `${getEmployeeColor(hasAppointment.staff_id)} border-2 border-solid hover:opacity-80` 
                               : 'bg-background border-border/30 hover:bg-muted/20'
                           }`}
                           onClick={handleQuickBook}
                         >
                           {hasAppointment ? (
                             <div className="p-2 h-full flex flex-col justify-center relative">
                               <div className={`${isCompactView ? 'text-xs' : 'text-sm'} font-medium truncate`}>
                                 {hasAppointment.customer_name || 'Kunde'}
                               </div>
                               <div className="text-xs opacity-70 truncate">
                                 {hasAppointment.service_name || 'Service'}
                               </div>
                               <div className="text-xs font-medium text-primary truncate">
                                 {staff.find(emp => emp.id === hasAppointment.staff_id)?.name.split(' ')[0] || 'Mitarbeiter'}
                               </div>
                               {!isCompactView && (
                                 <div className="text-xs font-medium">
                                   CHF {hasAppointment.price}
                                 </div>
                               )}
                               {/* Employee and Gender indicators */}
                               <div className="absolute top-1 right-1 flex gap-1">
                                 <div className={`w-2 h-2 rounded-full bg-gray-400`} 
                                      title="Customer" />
                                 <div className={`w-2 h-2 rounded-full border ${getEmployeeColor(hasAppointment.staff_id).replace('bg-', 'bg-').replace('-100', '-500')}`} 
                                      title={staff.find(emp => emp.id === hasAppointment.staff_id)?.name || 'Mitarbeiter'} />
                               </div>
                             </div>
                          ) : (
                            <div className="p-2 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waiting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Warteschlange für freie Termine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waitingList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Kunden in der Warteschlange</p>
                  </div>
                ) : (
                  waitingList.map((customer) => (
                    <Card key={customer.id} className={`border-l-4 ${getWaitingListGenderColor(customer.gender)} hover:shadow-lg transition-all`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{customer.name}</h4>
                                <div className={`w-3 h-3 rounded-full ${
                                  customer.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                                }`} />
                              </div>
                              <Badge variant={customer.flexible ? "secondary" : "outline"}>
                                {customer.flexible ? 'Flexibel' : 'Fixiert'}
                              </Badge>
                              <Badge className={getPriorityColor(customer.priority)} variant="outline">
                                {customer.priority === 'high' ? 'Hoch' : customer.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div>
                                <strong>Service:</strong> {customer.preferredService}
                              </div>
                              <div>
                                <strong>Wunschtermin:</strong> {new Date(customer.preferredDate).toLocaleDateString('de-CH')}
                              </div>
                              <div>
                                <strong>Wunschzeit:</strong> {customer.preferredTime}
                              </div>
                              <div>
                                <strong>Wartet seit:</strong> {new Date(customer.waitingSince).toLocaleDateString('de-CH')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 hover:bg-green-50 hover:border-green-300"
                              onClick={() => handleContactCustomer(customer, 'phone')}
                            >
                              <Phone className="w-4 h-4" />
                              Anrufen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => handleContactCustomer(customer, 'email')}
                            >
                              <Mail className="w-4 h-4" />
                              E-Mail
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => bookFromWaitingList(customer)}
                              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                              Termin buchen
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => simulateWaitingListNotification(customer)}
                              className="gap-2 text-purple-600 hover:bg-purple-50"
                            >
                              🔔 Test Neon
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Appointment Booking/Edit Modal */}
      {showBookingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBookingDialog(false)}>
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-6">Termin bearbeiten</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kunde</label>
                  <Select defaultValue="maria">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maria">Maria Schmidt</SelectItem>
                      <SelectItem value="anna">Anna Müller</SelectItem>
                      <SelectItem value="sarah">Sarah Weber</SelectItem>
                      <SelectItem value="new">+ Neuer Kunde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Datum</label>
                  <Input type="date" defaultValue="2024-01-15" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dauer (Minuten)</label>
                  <Input type="number" defaultValue="60" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Behandlung</label>
                  <Select defaultValue="schnitt">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schnitt">Schnitt + Föhnen</SelectItem>
                      <SelectItem value="komplett">Komplett Service</SelectItem>
                      <SelectItem value="faerben">Färben + Schnitt</SelectItem>
                      <SelectItem value="waschen">Waschen + Föhnen</SelectItem>
                      <SelectItem value="bart">Bart + Styling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Preis (CHF)</label>
                  <Input type="number" defaultValue="65" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select defaultValue="bestätigt">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestätigt">Bestätigt</SelectItem>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                      <SelectItem value="storniert">Storniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Notizen</label>
                  <textarea 
                    className="w-full p-2 border border-input rounded-md bg-background text-sm resize-none"
                    rows={3}
                    placeholder="Besondere Wünsche oder Notizen..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <Button onClick={() => setShowBookingDialog(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                Löschen
              </Button>
              <Button className="flex-1">
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <AddCustomerModal 
          onClose={() => setShowNewCustomerModal(false)}
          onSave={(customer) => {
            console.log('New customer:', customer);
            setShowNewCustomerModal(false);
            // After creating customer, open booking dialog
            setShowBookingDialog(true);
          }}
        />
      )}

      {/* Neon Notification for Waiting List */}
      {showNeonNotification && neonNotificationData && (
        <div className="fixed top-4 right-4 z-[60] animate-pulse">
          <div className={`p-4 rounded-lg border-2 shadow-2xl ${getWaitingListGenderColor(neonNotificationData.gender)} 
            ring-4 ring-amber-400 ring-opacity-75 animate-bounce`}
            style={{
              background: `linear-gradient(45deg, ${neonNotificationData.gender === 'female' ? '#fce7f3, #fdf2f8' : '#dbeafe, #eff6ff'})`,
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full ${neonNotificationData.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'} 
                  animate-ping absolute`} />
                <div className={`w-4 h-4 rounded-full ${neonNotificationData.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`} />
              </div>
              <div>
                <div className="font-bold text-amber-800">🔥 FREIER TERMIN VERFÜGBAR!</div>
                <div className="text-sm font-medium">{neonNotificationData.name} - {neonNotificationData.preferredTime}</div>
                <div className="text-xs opacity-75">{neonNotificationData.preferredService}</div>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowNeonNotification(false)}
                className="ml-4 bg-amber-500 hover:bg-amber-600 text-white"
              >
                ✓ Verstanden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}