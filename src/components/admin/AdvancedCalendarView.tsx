/**
 * Sprint B: Advanced Calendar View Component
 * Enhanced appointment system with real booking functionality
 * Based on PLAN.md Sprint B requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  CalendarDays, 
  Grid3X3, 
  Layout, 
  Maximize2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock3,
  Users,
  Zap
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  apiService, 
  type Appointment, 
  type Staff, 
  type WaitingListEntry, 
  type TimeSlot,
  type AppointmentConflict
} from '@/services/api';

// Extended appointment interface with staff and customer data
interface ExtendedAppointment extends Appointment {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
  staff_name?: string;
  staff_color?: string;
}

// Sprint B: Enhanced calendar component with real appointment management
export function AdvancedCalendarView() {
  // State management for appointments and staff
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showWaitingListDialog, setShowWaitingListDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ExtendedAppointment | null>(null);
  const [appointmentConflicts, setAppointmentConflicts] = useState<AppointmentConflict[]>([]);
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    appointment_date: format(selectedDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    duration_minutes: 60,
    status: 'confirmed',
    currency: 'CHF'
  });

  // Load calendar data on component mount and when date changes
  useEffect(() => {
    loadCalendarData();
  }, [selectedDate, selectedStaff]);

  // Sprint B: Load real appointment data from API service
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on view type
      const startDate = viewType === 'week' 
        ? format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : format(selectedDate, 'yyyy-MM-dd');
      
      const endDate = viewType === 'week'
        ? format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        : format(selectedDate, 'yyyy-MM-dd');

      // Load appointments, staff, and waiting list in parallel
      const [appointmentsData, staffData, waitingListData] = await Promise.all([
        apiService.getAppointmentsByDateRange(startDate, endDate),
        apiService.getStaff(),
        apiService.getWaitingList()
      ]);

      // Enhance appointments with staff and customer data
      const enhancedAppointments: ExtendedAppointment[] = appointmentsData.map(apt => {
        const staffMember = staffData.find(s => s.id === apt.staff_id);
        return {
          ...apt,
          staff_name: staffMember?.full_name || 'Unknown',
          staff_color: getStaffColor(apt.staff_id),
          // Mock customer data - in real implementation would come from customer table
          customer_name: `Customer ${apt.customer_id}`,
          customer_email: `customer${apt.customer_id}@email.com`,
          service_name: `Service ${apt.service_id}`
        };
      });

      setAppointments(enhancedAppointments);
      setStaff(staffData);
      setWaitingList(waitingListData);
      
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Sprint B: Check for appointment conflicts
  const checkConflicts = async (appointment: Partial<Appointment>) => {
    try {
      const conflicts = await apiService.checkAppointmentConflicts(appointment);
      setAppointmentConflicts(conflicts);
      return conflicts;
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return [];
    }
  };

  // Sprint B: Load available time slots
  const loadAvailableSlots = async (date: string, serviceId: string) => {
    try {
      const slots = await apiService.getAvailableTimeSlots(date, serviceId, selectedStaff !== 'all' ? selectedStaff : undefined);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading available slots:', err);
    }
  };

  // Sprint B: Create new appointment with conflict detection
  const handleCreateAppointment = async () => {
    try {
      // Check for conflicts first
      const conflicts = await checkConflicts(newAppointment);
      if (conflicts.length > 0) {
        // Show conflicts to user, but allow override
        const proceed = confirm(`Conflicts detected: ${conflicts.map(c => c.message).join(', ')}. Continue anyway?`);
        if (!proceed) return;
      }

      const appointment = await apiService.createAppointment(newAppointment);
      await loadCalendarData(); // Refresh calendar
      setShowAppointmentDialog(false);
      
      // Reset form
      setNewAppointment({
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: '09:00',
        duration_minutes: 60,
        status: 'confirmed',
        currency: 'CHF'
      });
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment');
    }
  };

  // Sprint B: Convert waiting list entry to appointment
  const handleConvertWaitingList = async (entryId: string, timeSlot: TimeSlot) => {
    try {
      await apiService.convertWaitingListToAppointment(entryId, timeSlot);
      await loadCalendarData(); // Refresh calendar
    } catch (err) {
      console.error('Error converting waiting list:', err);
      setError('Failed to convert waiting list entry');
    }
  };

  // Helper functions
  const getStaffColor = (staffId: string): string => {
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100'];
    const index = staff.findIndex(s => s.id === staffId);
    return colors[index % colors.length] || 'bg-gray-100';
  };

  const getStatusColor = (status: Appointment['status']): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled_by_customer':
      case 'cancelled_by_salon': return 'bg-red-500';
      case 'no_show': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getAppointmentsForStaff = (staffId: string, date: Date) => {
    return getAppointmentsForDay(date).filter(apt => apt.staff_id === staffId);
  };

  // Render time slots for day view
  const renderTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(
          <div key={time} className="h-12 border-b border-gray-100 flex items-center pl-2 text-sm text-gray-500">
            {time}
          </div>
        );
      }
    }
    return slots;
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: ExtendedAppointment) => (
    <div
      key={appointment.id}
      className={`p-2 mb-1 rounded cursor-pointer ${getStaffColor(appointment.staff_id)} border-l-4 ${getStatusColor(appointment.status)}`}
      onClick={() => setSelectedAppointment(appointment)}
    >
      <div className="text-sm font-medium">{appointment.start_time} - {appointment.end_time}</div>
      <div className="text-xs">{appointment.customer_name}</div>
      <div className="text-xs text-gray-600">{appointment.service_name}</div>
      <div className="text-xs text-gray-500">{appointment.staff_name}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B: Advanced Calendar</h1>
          <Badge variant="outline" className="bg-green-50">
            <Zap className="w-3 h-3 mr-1" />
            Real Appointment System
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-medium min-w-[200px] text-center">
              {format(selectedDate, 'MMMM yyyy', { locale: de })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View type selector */}
          <Select value={viewType} onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Tag</SelectItem>
              <SelectItem value="week">Woche</SelectItem>
              <SelectItem value="month">Monat</SelectItem>
            </SelectContent>
          </Select>

          {/* Staff filter */}
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Mitarbeiter</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name} ({s.position})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAppointmentDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Termin
          </Button>
          <Button variant="outline" onClick={() => setShowWaitingListDialog(true)}>
            <Users className="w-4 h-4 mr-2" />
            Warteliste ({waitingList.length})
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Suche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-0">
          {viewType === 'week' && (
            <div className="grid grid-cols-8 min-h-[600px]">
              {/* Time column */}
              <div className="border-r">
                <div className="h-12 border-b flex items-center justify-center font-medium">Zeit</div>
                {renderTimeSlots()}
              </div>
              
              {/* Day columns */}
              {getWeekDays().map((day, index) => (
                <div key={index} className={`border-r ${isToday(day) ? 'bg-blue-50' : ''}`}>
                  <div className="h-12 border-b flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">
                        {format(day, 'E', { locale: de })}
                      </div>
                      <div className={`text-lg font-medium ${isToday(day) ? 'text-blue-600' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Appointments for this day */}
                  <div className="p-2 space-y-1">
                    {selectedStaff === 'all' 
                      ? getAppointmentsForDay(day).map(renderAppointmentCard)
                      : getAppointmentsForStaff(selectedStaff, day).map(renderAppointmentCard)
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CalendarDays className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Termine heute</p>
                <p className="text-2xl font-bold">{getAppointmentsForDay(new Date()).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Warteliste</p>
                <p className="text-2xl font-bold">{waitingList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Aktive Mitarbeiter</p>
                <p className="text-2xl font-bold">{staff.filter(s => s.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Bestätigte Termine</p>
                <p className="text-2xl font-bold">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Termin</DialogTitle>
            <DialogDescription>
              Sprint B: Termin mit Konfliktprüfung erstellen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={newAppointment.appointment_date}
                onChange={(e) => setNewAppointment(prev => ({
                  ...prev,
                  appointment_date: e.target.value
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="time">Uhrzeit</Label>
              <Select
                value={newAppointment.start_time}
                onValueChange={(value) => setNewAppointment(prev => ({
                  ...prev,
                  start_time: value,
                  end_time: addMinutes(value, prev.duration_minutes || 60)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot.start_time} value={slot.start_time}>
                      {slot.start_time} - {slot.staff_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="staff">Mitarbeiter</Label>
              <Select
                value={newAppointment.staff_id}
                onValueChange={(value) => setNewAppointment(prev => ({
                  ...prev,
                  staff_id: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {appointmentConflicts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Konflikte erkannt</span>
                </div>
                {appointmentConflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-yellow-700">
                    {conflict.message}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateAppointment}>
              Termin erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiting List Dialog */}
      <Dialog open={showWaitingListDialog} onOpenChange={setShowWaitingListDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Warteliste verwalten</DialogTitle>
            <DialogDescription>
              Sprint B: Automatische Terminfindung und Wartelisten-Konvertierung
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {waitingList.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Customer {entry.customer_id}</div>
                    <div className="text-sm text-gray-600">
                      Service: {entry.service_id} | Priorität: {entry.priority}
                    </div>
                    <div className="text-sm text-gray-500">
                      Bevorzugt: {entry.preferred_date} {entry.preferred_time_start}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={entry.priority === 'high' ? 'destructive' : 'secondary'}>
                      {entry.priority}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => loadAvailableSlots(entry.preferred_date || '', entry.service_id)}
                    >
                      Termine finden
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {waitingList.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Einträge in der Warteliste
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWaitingListDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to add minutes to time string
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}