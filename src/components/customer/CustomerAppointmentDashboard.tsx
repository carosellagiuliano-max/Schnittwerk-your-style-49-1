/**
 * Sprint B Week 8: Customer Appointment Dashboard
 * Complete customer portal for appointment management
 * Based on PLAN.md Sprint B Week 8 requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Star, 
  MessageSquare, 
  Phone, 
  Mail,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Smartphone,
  CreditCard,
  History,
  Bell,
  Settings,
  Heart,
  Gift,
  Scissors
} from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import { apiService, type Appointment, type Customer, type Service, type Staff } from '@/services/api';

interface AppointmentWithDetails extends Appointment {
  canCancel: boolean;
  canReschedule: boolean;
  canRate: boolean;
}

interface CustomerStats {
  totalAppointments: number;
  upcomingAppointments: number;
  totalSpent: number;
  loyaltyLevel: string;
  favoriteService: string;
  lastVisit: string;
}

export function CustomerAppointmentDashboard() {
  // State management
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // UI state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // In real app, customer ID would come from auth context
      const mockCustomerId = '1'; // Mock customer ID
      
      const [appointmentsData, customerData, servicesData, staffData] = await Promise.all([
        apiService.getCustomerAppointments(mockCustomerId),
        apiService.getCustomer(mockCustomerId),
        apiService.getServices(),
        apiService.getStaff()
      ]);
      
      // Enhance appointments with additional properties
      const enhancedAppointments = appointmentsData.map((apt): AppointmentWithDetails => ({
        ...apt,
        canCancel: apt.status === 'confirmed' && isFuture(parseISO(apt.appointment_date)),
        canReschedule: apt.status === 'confirmed' && isFuture(parseISO(apt.appointment_date)),
        canRate: apt.status === 'completed' && isPast(parseISO(apt.appointment_date))
      }));
      
      setAppointments(enhancedAppointments);
      setCustomer(customerData);
      setServices(servicesData);
      setStaff(staffData);
      
      // Calculate customer stats
      const totalAppointments = appointmentsData.length;
      const upcomingAppointments = appointmentsData.filter(apt => 
        apt.status === 'confirmed' && isFuture(parseISO(apt.appointment_date))
      ).length;
      const totalSpent = appointmentsData
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + apt.price, 0);
      
      const stats: CustomerStats = {
        totalAppointments,
        upcomingAppointments,
        totalSpent,
        loyaltyLevel: customerData.loyalty_status || 'neu',
        favoriteService: 'Schnitt & Styling', // Mock data
        lastVisit: appointmentsData
          .filter(apt => apt.status === 'completed')
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]?.appointment_date || ''
      };
      
      setStats(stats);
      
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await apiService.cancelAppointment(selectedAppointment.id, cancelReason);
      await loadCustomerData();
      setShowCancelDialog(false);
      setCancelReason('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
  };

  const handleRateAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await apiService.rateAppointment(selectedAppointment.id, rating, feedback);
      await loadCustomerData();
      setShowRatingDialog(false);
      setRating(5);
      setFeedback('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error rating appointment:', error);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled_by_customer': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled_by_customer': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStaffName = (staffId: string): string => {
    return staff.find(s => s.id === staffId)?.full_name || 'Unbekannt';
  };

  const getLoyaltyColor = (level: string) => {
    switch (level) {
      case 'diamant': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silber': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'confirmed' && isFuture(parseISO(apt.appointment_date))
  );

  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' || (apt.status === 'cancelled_by_customer' && isPast(parseISO(apt.appointment_date)))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sprint B Week 8: Customer Portal</h1>
        <p className="text-gray-600">Willkommen zurück, {customer?.full_name}!</p>
        <Badge variant="outline" className="bg-blue-50">
          <Smartphone className="w-3 h-3 mr-1" />
          Mobile-Responsive Dashboard
        </Badge>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nächster Termin</p>
                  <p className="text-2xl font-bold text-green-600">{stats.upcomingAppointments}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gesamt Termine</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalAppointments}</p>
                </div>
                <History className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ausgegeben</p>
                  <p className="text-2xl font-bold text-purple-600">CHF {stats.totalSpent}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loyalty Status</p>
                  <Badge className={getLoyaltyColor(stats.loyaltyLevel)}>
                    {stats.loyaltyLevel}
                  </Badge>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scissors className="w-5 h-5 mr-2" />
            Schnellaktionen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-16 text-left justify-start" 
              variant="outline"
              onClick={() => setShowBookingDialog(true)}
            >
              <div className="flex items-center space-x-3">
                <Plus className="w-6 h-6 text-green-500" />
                <div>
                  <div className="font-medium">Neuer Termin</div>
                  <div className="text-sm text-gray-500">Termin buchen</div>
                </div>
              </div>
            </Button>

            <Button className="h-16 text-left justify-start" variant="outline">
              <div className="flex items-center space-x-3">
                <Gift className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="font-medium">Gutschein</div>
                  <div className="text-sm text-gray-500">Geschenk kaufen</div>
                </div>
              </div>
            </Button>

            <Button className="h-16 text-left justify-start" variant="outline">
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <div className="font-medium">Produkte</div>
                  <div className="text-sm text-gray-500">Shop besuchen</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Meine Termine</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                Kommende Termine ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Vergangene Termine ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Appointments */}
            <TabsContent value="upcoming" className="space-y-4 mt-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {format(parseISO(appointment.appointment_date), 'd')}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{appointment.service_name}</h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1">{appointment.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{format(parseISO(appointment.appointment_date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{appointment.start_time} - {appointment.end_time} ({appointment.duration_minutes} Min.)</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{getStaffName(appointment.staff_id)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="font-medium">CHF {appointment.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          {appointment.canReschedule && (
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Verschieben
                            </Button>
                          )}
                          
                          {appointment.canCancel && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCancelDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Stornieren
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <p className="text-sm text-gray-600">{appointment.notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Keine kommenden Termine</h3>
                  <p className="mb-4">Buchen Sie Ihren nächsten Termin!</p>
                  <Button onClick={() => setShowBookingDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Termin buchen
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Past Appointments */}
            <TabsContent value="past" className="space-y-4 mt-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                            {format(parseISO(appointment.appointment_date), 'd')}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{appointment.service_name}</h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1">{appointment.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{format(parseISO(appointment.appointment_date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{getStaffName(appointment.staff_id)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4" />
                                <span className="font-medium">CHF {appointment.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowBookingDialog(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Erneut buchen
                          </Button>
                          
                          {appointment.canRate && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowRatingDialog(true);
                              }}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Bewerten
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Keine vergangenen Termine</h3>
                  <p>Ihre Terminhistorie wird hier angezeigt.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* New Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Termin buchen</DialogTitle>
            <DialogDescription>
              Sprint B Week 8: Mobile-optimierte Buchung
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Buchungssystem</h3>
            <p>Die vollständige Buchungsschnittstelle wird hier integriert.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Abbrechen
            </Button>
            <Button>Weiter zur Buchung</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Termin stornieren</DialogTitle>
            <DialogDescription>
              Möchten Sie diesen Termin wirklich stornieren?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Label htmlFor="cancel_reason">Grund der Stornierung (optional)</Label>
            <Textarea
              id="cancel_reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Grund für die Stornierung..."
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              Termin stornieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Termin bewerten</DialogTitle>
            <DialogDescription>
              Wie war Ihr Besuch bei uns?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Bewertung</Label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="feedback">Feedback (optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Teilen Sie Ihre Erfahrung mit uns..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleRateAppointment}>
              Bewertung abgeben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}