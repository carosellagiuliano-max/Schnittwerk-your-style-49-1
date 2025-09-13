/**
 * Sprint B Week 7: Advanced Calendar Views (Day/Week/Month)
 * Enhanced calendar system with multiple view modes and real-time updates
 * Based on PLAN.md Sprint B Week 7 requirements
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  Filter,
  Maximize2
} from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { apiService, type Appointment, type Staff } from '@/services/api';

type ViewMode = 'day' | 'week' | 'month';

interface TimeSlot {
  time: string;
  hour: number;
  appointments: Appointment[];
}

interface CalendarDay {
  date: Date;
  appointments: Appointment[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function AdvancedCalendarViews() {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');

  // Load data on mount and when date changes
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      const [appointmentsData, staffData] = await Promise.all([
        apiService.getAppointments(),
        apiService.getStaff()
      ]);
      
      setAppointments(appointmentsData);
      setStaff(staffData);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter appointments by staff if selected
  const filteredAppointments = useMemo(() => {
    if (selectedStaffFilter === 'all') {
      return appointments;
    }
    return appointments.filter(apt => apt.staff_id === selectedStaffFilter);
  }, [appointments, selectedStaffFilter]);

  // Generate time slots for day/week view
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time,
        hour,
        appointments: filteredAppointments.filter(apt => {
          const aptTime = apt.start_time;
          return aptTime.startsWith(hour.toString().padStart(2, '0'));
        })
      });
    }
    return slots;
  }, [filteredAppointments]);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: CalendarDay[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dayAppointments = filteredAppointments.filter(apt => 
        isSameDay(parseISO(apt.appointment_date), day)
      );

      days.push({
        date: day,
        appointments: dayAppointments,
        isCurrentMonth: day >= monthStart && day <= monthEnd,
        isToday: isSameDay(day, new Date())
      });

      day = addDays(day, 1);
    }

    return days;
  }, [currentDate, filteredAppointments]);

  // Generate week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayAppointments = filteredAppointments.filter(apt => 
        isSameDay(parseISO(apt.appointment_date), day)
      );

      days.push({
        date: day,
        appointments: dayAppointments,
        isCurrentMonth: true,
        isToday: isSameDay(day, new Date())
      });
    }

    return days;
  }, [currentDate, filteredAppointments]);

  const getAppointmentStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled_by_customer':
      case 'cancelled_by_salon': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStaffName = (staffId: string): string => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.full_name || 'Unknown Staff';
  };

  const formatViewTitle = (): string => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd. MMM', { locale: de })} - ${format(weekEnd, 'd. MMM yyyy', { locale: de })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: de });
      default:
        return '';
    }
  };

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
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B Week 7: Advanced Calendar</h1>
          <Badge variant="outline" className="bg-blue-50">
            <CalendarIcon className="w-3 h-3 mr-1" />
            Multi-View Calendar System
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Staff Filter */}
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Alle Mitarbeiter</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={goToToday}>
            Heute
          </Button>
        </div>
      </div>

      {/* View mode tabs and navigation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="day">Tag</TabsTrigger>
                <TabsTrigger value="week">Woche</TabsTrigger>
                <TabsTrigger value="month">Monat</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="min-w-[250px] text-center">
                <h2 className="font-semibold">{formatViewTitle()}</h2>
              </div>
              
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Day View */}
          {viewMode === 'day' && (
            <div className="space-y-2">
              <div className="text-center py-4 border-b">
                <h3 className="text-lg font-medium">
                  {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                </h3>
                <p className="text-sm text-gray-500">
                  {filteredAppointments.filter(apt => 
                    isSameDay(parseISO(apt.appointment_date), currentDate)
                  ).length} Termine
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="flex items-start space-x-4 py-2 border-b">
                    <div className="w-16 text-sm text-gray-500 font-mono">
                      {slot.time}
                    </div>
                    <div className="flex-1">
                      {slot.appointments.filter(apt => 
                        isSameDay(parseISO(apt.appointment_date), currentDate)
                      ).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-2 mb-2 rounded border cursor-pointer transition-colors hover:opacity-80 ${getAppointmentStatusColor(appointment.status)}`}
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetails(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {appointment.start_time} - {appointment.end_time}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm">
                            <div>{appointment.customer_name}</div>
                            <div className="text-gray-600">{appointment.service_name}</div>
                            <div className="text-gray-500">{getStaffName(appointment.staff_id)}</div>
                          </div>
                        </div>
                      ))}
                      {slot.appointments.filter(apt => 
                        isSameDay(parseISO(apt.appointment_date), currentDate)
                      ).length === 0 && (
                        <div className="text-gray-400 text-sm italic">Keine Termine</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-2">
                <div className="text-sm font-medium text-gray-500"></div>
                {weekDays.map((day) => (
                  <div key={day.date.toISOString()} className="text-center">
                    <div className={`text-sm font-medium ${day.isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {format(day.date, 'EEE', { locale: de })}
                    </div>
                    <div className={`text-lg ${day.isToday ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                      {format(day.date, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <>
                    <div key={`time-${slot.time}`} className="text-xs text-gray-500 text-right pr-2 py-1">
                      {slot.time}
                    </div>
                    {weekDays.map((day) => {
                      const dayAppointments = slot.appointments.filter(apt => 
                        isSameDay(parseISO(apt.appointment_date), day.date)
                      );
                      
                      return (
                        <div key={`${day.date.toISOString()}-${slot.time}`} className="min-h-[60px] border border-gray-100 p-1">
                          {dayAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className={`text-xs p-1 mb-1 rounded cursor-pointer ${getAppointmentStatusColor(appointment.status)}`}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAppointmentDetails(true);
                              }}
                            >
                              <div className="truncate font-medium">{appointment.customer_name}</div>
                              <div className="truncate text-gray-600">{appointment.service_name}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded cursor-pointer transition-colors hover:bg-gray-50 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${day.isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => setCurrentDate(day.date)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day.date, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {day.appointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`text-xs p-1 rounded cursor-pointer ${getAppointmentStatusColor(appointment.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetails(true);
                          }}
                        >
                          <div className="truncate">{appointment.start_time}</div>
                          <div className="truncate">{appointment.customer_name}</div>
                        </div>
                      ))}
                      {day.appointments.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{day.appointments.length - 3} mehr
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Termindetails</DialogTitle>
            <DialogDescription>
              Sprint B Week 7: Erweiterte Terminverwaltung
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedAppointment.customer_name}</h3>
                <Badge className={getAppointmentStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span>{format(parseISO(selectedAppointment.appointment_date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{selectedAppointment.start_time} - {selectedAppointment.end_time}</span>
                  <span className="text-gray-500">({selectedAppointment.duration_minutes} Min.)</span>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{getStaffName(selectedAppointment.staff_id)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedAppointment.service_name}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-medium">Preis:</span>
                  <span className="text-lg font-bold">CHF {selectedAppointment.price}</span>
                </div>

                {selectedAppointment.notes && (
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-1">Notizen:</div>
                    <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDetails(false)}>
              Schließen
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}