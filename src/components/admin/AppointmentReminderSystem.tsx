/**
 * Sprint B Week 6: Appointment Reminder System
 * Email/SMS notification system with automated reminders
 * Based on PLAN.md Sprint B requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Phone,
  Settings,
  Zap,
  AlertTriangle,
  RefreshCw,
  Plus,
  BarChart3
} from 'lucide-react';
import { format, addDays, addHours, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  apiService, 
  type Appointment, 
  type Customer,
  type Staff
} from '@/services/api';

// Notification types and interfaces
interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  trigger: 'booking_confirmation' | '24h_reminder' | '2h_reminder' | 'appointment_change' | 'cancellation';
  subject?: string;
  message: string;
  is_active: boolean;
}

interface NotificationSchedule {
  id: string;
  appointment_id: string;
  customer_id: string;
  notification_type: 'email' | 'sms';
  trigger_time: string;
  status: 'pending' | 'sent' | 'failed';
  template_id: string;
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

interface NotificationStats {
  total_sent: number;
  email_sent: number;
  sms_sent: number;
  success_rate: number;
  failed_notifications: number;
  pending_notifications: number;
}

export function AppointmentReminderSystem() {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_sent: 0,
    email_sent: 0,
    sms_sent: 0,
    success_rate: 0,
    failed_notifications: 0,
    pending_notifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate>>({});
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadReminderData();
    loadNotificationTemplates();
  }, []);

  // Auto-refresh pending notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      processNotificationQueue();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Sprint B Week 6: Load reminder system data
  const loadReminderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load upcoming appointments for next 7 days
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      
      const [appointmentsData, customersData, staffData] = await Promise.all([
        apiService.getAppointmentsByDateRange(today, nextWeek),
        apiService.getCustomers(),
        apiService.getStaff()
      ]);
      
      setAppointments(appointmentsData);
      setCustomers(customersData);
      setStaff(staffData);
      
      // Mock notification schedules - in real implementation would come from database
      const mockSchedules: NotificationSchedule[] = appointmentsData.flatMap(apt => [
        {
          id: `schedule_${apt.id}_24h`,
          appointment_id: apt.id,
          customer_id: apt.customer_id,
          notification_type: 'email',
          trigger_time: format(addHours(new Date(apt.appointment_date + 'T' + apt.start_time), -24), 'yyyy-MM-dd\'T\'HH:mm:ss'),
          status: 'pending',
          template_id: '24h_reminder',
          created_at: new Date().toISOString()
        },
        {
          id: `schedule_${apt.id}_2h`,
          appointment_id: apt.id,
          customer_id: apt.customer_id,
          notification_type: 'sms',
          trigger_time: format(addHours(new Date(apt.appointment_date + 'T' + apt.start_time), -2), 'yyyy-MM-dd\'T\'HH:mm:ss'),
          status: 'pending',
          template_id: '2h_reminder',
          created_at: new Date().toISOString()
        }
      ]);
      
      setSchedules(mockSchedules);
      
      // Calculate stats
      calculateNotificationStats(mockSchedules);
      
    } catch (err) {
      console.error('Error loading reminder data:', err);
      setError('Failed to load reminder data');
    } finally {
      setLoading(false);
    }
  };

  // Sprint B Week 6: Load notification templates
  const loadNotificationTemplates = () => {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'booking_confirmation',
        name: 'Booking Confirmation',
        type: 'email',
        trigger: 'booking_confirmation',
        subject: 'Terminbestätigung - Schnittwerk',
        message: `Liebe/r {{customer_name}},

Ihr Termin wurde erfolgreich gebucht:

📅 Datum: {{appointment_date}}
🕐 Uhrzeit: {{appointment_time}}
✂️ Service: {{service_name}}
👩‍💼 Stylist: {{staff_name}}

Bitte erscheinen Sie pünktlich zu Ihrem Termin.

Freundliche Grüße,
Ihr Schnittwerk Team`,
        is_active: true
      },
      {
        id: '24h_reminder',
        name: '24h Reminder',
        type: 'email',
        trigger: '24h_reminder',
        subject: 'Termin-Erinnerung - Morgen bei Schnittwerk',
        message: `Liebe/r {{customer_name}},

wir möchten Sie an Ihren Termin morgen erinnern:

📅 Datum: {{appointment_date}}
🕐 Uhrzeit: {{appointment_time}}
✂️ Service: {{service_name}}
👩‍💼 Stylist: {{staff_name}}

Falls Sie den Termin nicht wahrnehmen können, melden Sie sich bitte mindestens 24h vorher.

Freundliche Grüße,
Ihr Schnittwerk Team`,
        is_active: true
      },
      {
        id: '2h_reminder',
        name: '2h SMS Reminder',
        type: 'sms',
        trigger: '2h_reminder',
        message: 'Schnittwerk Erinnerung: Ihr Termin heute um {{appointment_time}} mit {{staff_name}}. Bis gleich!',
        is_active: true
      },
      {
        id: 'appointment_change',
        name: 'Appointment Change',
        type: 'email',
        trigger: 'appointment_change',
        subject: 'Terminänderung - Schnittwerk',
        message: `Liebe/r {{customer_name}},

Ihr Termin wurde geändert:

NEUER TERMIN:
📅 Datum: {{appointment_date}}
🕐 Uhrzeit: {{appointment_time}}
✂️ Service: {{service_name}}
👩‍💼 Stylist: {{staff_name}}

Bitte speichern Sie den neuen Termin in Ihrem Kalender.

Freundliche Grüße,
Ihr Schnittwerk Team`,
        is_active: true
      },
      {
        id: 'cancellation',
        name: 'Cancellation Notice',
        type: 'email',
        trigger: 'cancellation',
        subject: 'Terminabsage - Schnittwerk',
        message: `Liebe/r {{customer_name}},

Ihr Termin am {{appointment_date}} um {{appointment_time}} wurde storniert.

Falls Sie einen neuen Termin buchen möchten, kontaktieren Sie uns gerne.

Freundliche Grüße,
Ihr Schnittwerk Team`,
        is_active: true
      }
    ];
    
    setTemplates(defaultTemplates);
  };

  // Sprint B Week 6: Calculate notification statistics
  const calculateNotificationStats = (schedulesData: NotificationSchedule[]) => {
    const total = schedulesData.length;
    const sent = schedulesData.filter(s => s.status === 'sent').length;
    const failed = schedulesData.filter(s => s.status === 'failed').length;
    const pending = schedulesData.filter(s => s.status === 'pending').length;
    const emailSent = schedulesData.filter(s => s.status === 'sent' && s.notification_type === 'email').length;
    const smsSent = schedulesData.filter(s => s.status === 'sent' && s.notification_type === 'sms').length;
    
    setStats({
      total_sent: sent,
      email_sent: emailSent,
      sms_sent: smsSent,
      success_rate: total > 0 ? (sent / total) * 100 : 0,
      failed_notifications: failed,
      pending_notifications: pending
    });
  };

  // Sprint B Week 6: Process notification queue
  const processNotificationQueue = async () => {
    try {
      const now = new Date();
      const pendingNotifications = schedules.filter(schedule => 
        schedule.status === 'pending' && 
        new Date(schedule.trigger_time) <= now
      );
      
      for (const notification of pendingNotifications) {
        await sendNotification(notification);
      }
      
      if (pendingNotifications.length > 0) {
        await loadReminderData(); // Refresh data
      }
      
    } catch (err) {
      console.error('Error processing notification queue:', err);
    }
  };

  // Sprint B Week 6: Send individual notification
  const sendNotification = async (schedule: NotificationSchedule): Promise<boolean> => {
    try {
      const appointment = appointments.find(a => a.id === schedule.appointment_id);
      const customer = customers.find(c => c.id === schedule.customer_id);
      const template = templates.find(t => t.id === schedule.template_id);
      const staffMember = staff.find(s => s.id === appointment?.staff_id);
      
      if (!appointment || !customer || !template) {
        throw new Error('Missing appointment, customer, or template data');
      }
      
      // Replace template variables
      const message = replaceTemplateVariables(template.message, {
        customer_name: customer.full_name,
        appointment_date: format(new Date(appointment.appointment_date), 'dd.MM.yyyy', { locale: de }),
        appointment_time: appointment.start_time,
        service_name: `Service ${appointment.service_id}`, // Mock service name
        staff_name: staffMember?.full_name || 'Unknown'
      });
      
      // Simulate sending notification
      console.log(`[${schedule.notification_type.toUpperCase()}] Sending to ${customer.email || customer.phone}:`, message);
      
      // Update schedule status
      const updatedSchedules = schedules.map(s => 
        s.id === schedule.id 
          ? { ...s, status: 'sent' as const, sent_at: new Date().toISOString() }
          : s
      );
      setSchedules(updatedSchedules);
      
      return true;
      
    } catch (err) {
      console.error('Error sending notification:', err);
      
      // Update schedule with error
      const updatedSchedules = schedules.map(s => 
        s.id === schedule.id 
          ? { ...s, status: 'failed' as const, error_message: err instanceof Error ? err.message : 'Unknown error' }
          : s
      );
      setSchedules(updatedSchedules);
      
      return false;
    }
  };

  // Replace template variables with actual values
  const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  // Sprint B Week 6: Save notification template
  const handleSaveTemplate = async () => {
    try {
      const newTemplate: NotificationTemplate = {
        id: editingTemplate.id || `template_${Date.now()}`,
        name: editingTemplate.name || '',
        type: editingTemplate.type || 'email',
        trigger: editingTemplate.trigger || 'booking_confirmation',
        subject: editingTemplate.subject,
        message: editingTemplate.message || '',
        is_active: editingTemplate.is_active ?? true
      };
      
      const updatedTemplates = editingTemplate.id 
        ? templates.map(t => t.id === editingTemplate.id ? newTemplate : t)
        : [...templates, newTemplate];
      
      setTemplates(updatedTemplates);
      setShowTemplateDialog(false);
      setEditingTemplate({});
      
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    }
  };

  // Send test notification
  const handleSendTest = async () => {
    try {
      if (testRecipient && testMessage) {
        console.log(`[TEST] Sending to ${testRecipient}:`, testMessage);
        setShowTestDialog(false);
        setTestRecipient('');
        setTestMessage('');
      }
    } catch (err) {
      console.error('Error sending test:', err);
    }
  };

  // Helper functions
  const getTriggerIcon = (trigger: NotificationTemplate['trigger']) => {
    switch (trigger) {
      case 'booking_confirmation': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case '24h_reminder': return <Clock className="w-4 h-4 text-blue-500" />;
      case '2h_reminder': return <Bell className="w-4 h-4 text-orange-500" />;
      case 'appointment_change': return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case 'cancellation': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: NotificationSchedule['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading reminder system...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B: Appointment Reminders</h1>
          <Badge variant="outline" className="bg-blue-50">
            <Bell className="w-3 h-3 mr-1" />
            Automated Notifications
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={processNotificationQueue}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Process Queue
          </Button>
          
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </Button>
          
          <Button onClick={() => {
            setEditingTemplate({
              type: 'email',
              trigger: 'booking_confirmation',
              is_active: true
            });
            setShowTemplateDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Send className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Email Sent</p>
                <p className="text-2xl font-bold">{stats.email_sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">SMS Sent</p>
                <p className="text-2xl font-bold">{stats.sms_sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending_notifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="queue">Notification Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedules
                    .filter(s => s.status === 'pending')
                    .sort((a, b) => new Date(a.trigger_time).getTime() - new Date(b.trigger_time).getTime())
                    .slice(0, 5)
                    .map((schedule) => {
                      const appointment = appointments.find(a => a.id === schedule.appointment_id);
                      const customer = customers.find(c => c.id === schedule.customer_id);
                      
                      return (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            {schedule.notification_type === 'email' ? 
                              <Mail className="w-4 h-4 text-blue-500" /> : 
                              <MessageSquare className="w-4 h-4 text-purple-500" />
                            }
                            <div>
                              <div className="font-medium">{customer?.full_name}</div>
                              <div className="text-sm text-gray-600">
                                {format(new Date(schedule.trigger_time), 'dd.MM.yyyy HH:mm')}
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Template Status */}
            <Card>
              <CardHeader>
                <CardTitle>Template Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {getTriggerIcon(template.trigger)}
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.type}</div>
                        </div>
                      </div>
                      <Switch checked={template.is_active} disabled />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTriggerIcon(template.trigger)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {template.type.toUpperCase()} • {template.trigger.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={template.is_active} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.subject && (
                    <div className="mb-3">
                      <Label className="text-sm font-medium">Subject:</Label>
                      <p className="text-sm text-gray-700">{template.subject}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Message:</Label>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notification Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <div className="space-y-4">
            {schedules
              .filter(s => s.status === 'pending')
              .sort((a, b) => new Date(a.trigger_time).getTime() - new Date(b.trigger_time).getTime())
              .map((schedule) => {
                const appointment = appointments.find(a => a.id === schedule.appointment_id);
                const customer = customers.find(c => c.id === schedule.customer_id);
                const template = templates.find(t => t.id === schedule.template_id);
                
                return (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {schedule.notification_type === 'email' ? 
                              <Mail className="w-5 h-5 text-blue-500" /> : 
                              <MessageSquare className="w-5 h-5 text-purple-500" />
                            }
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{customer?.full_name}</h3>
                              <Badge variant="outline">{template?.name}</Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              Scheduled: {format(new Date(schedule.trigger_time), 'dd.MM.yyyy HH:mm')}
                            </div>
                            
                            {appointment && (
                              <div className="text-sm text-gray-500">
                                Appointment: {format(new Date(appointment.appointment_date), 'dd.MM.yyyy')} at {appointment.start_time}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendNotification(schedule)}
                          >
                            Send Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            
            {schedules.filter(s => s.status === 'pending').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No pending notifications</h3>
                <p>All notifications are up to date!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {schedules
              .filter(s => s.status !== 'pending')
              .sort((a, b) => new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime())
              .map((schedule) => {
                const customer = customers.find(c => c.id === schedule.customer_id);
                const template = templates.find(t => t.id === schedule.template_id);
                
                return (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {schedule.status === 'sent' ? 
                              <CheckCircle className="w-5 h-5 text-green-500" /> : 
                              <XCircle className="w-5 h-5 text-red-500" />
                            }
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{customer?.full_name}</h3>
                              <Badge variant="outline">{template?.name}</Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {schedule.status === 'sent' ? 'Sent' : 'Failed'}: {schedule.sent_at ? format(new Date(schedule.sent_at), 'dd.MM.yyyy HH:mm') : 'N/A'}
                            </div>
                            
                            {schedule.error_message && (
                              <div className="text-sm text-red-600">
                                Error: {schedule.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate.id ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              Sprint B Week 6: Create or modify notification templates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingTemplate.name || ''}
                  onChange={(e) => setEditingTemplate(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editingTemplate.type}
                  onValueChange={(value: 'email' | 'sms') => setEditingTemplate(prev => ({
                    ...prev,
                    type: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="trigger">Trigger</Label>
              <Select
                value={editingTemplate.trigger}
                onValueChange={(value: any) => setEditingTemplate(prev => ({
                  ...prev,
                  trigger: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                  <SelectItem value="24h_reminder">24h Reminder</SelectItem>
                  <SelectItem value="2h_reminder">2h Reminder</SelectItem>
                  <SelectItem value="appointment_change">Appointment Change</SelectItem>
                  <SelectItem value="cancellation">Cancellation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editingTemplate.type === 'email' && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editingTemplate.subject || ''}
                  onChange={(e) => setEditingTemplate(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={8}
                value={editingTemplate.message || ''}
                onChange={(e) => setEditingTemplate(prev => ({
                  ...prev,
                  message: e.target.value
                }))}
                placeholder="Use {{customer_name}}, {{appointment_date}}, {{appointment_time}}, {{service_name}}, {{staff_name}} for dynamic content"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingTemplate.is_active}
                onCheckedChange={(checked) => setEditingTemplate(prev => ({
                  ...prev,
                  is_active: checked
                }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Notification</DialogTitle>
            <DialogDescription>
              Test the notification system with a custom message
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="test_recipient">Recipient (Email/Phone)</Label>
              <Input
                id="test_recipient"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="test@example.com or +41791234567"
              />
            </div>
            
            <div>
              <Label htmlFor="test_message">Message</Label>
              <Textarea
                id="test_message"
                rows={4}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test message content..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest}>
              <Send className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}