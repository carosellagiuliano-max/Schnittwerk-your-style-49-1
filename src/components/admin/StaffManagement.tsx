/**
 * Sprint B: Staff Management Component
 * Advanced staff management with scheduling and performance tracking
 * Based on PLAN.md Sprint B requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Scissors, 
  TrendingUp, 
  DollarSign,
  Users,
  Plus,
  Edit,
  Trash2,
  Settings,
  Award,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  apiService, 
  type Staff, 
  type StaffSchedule, 
  type Appointment 
} from '@/services/api';

// Staff performance metrics interface
interface StaffPerformance {
  staff_id: string;
  total_appointments: number;
  completed_appointments: number;
  total_revenue: number;
  average_rating: number;
  utilization_rate: number;
  commission_earned: number;
}

export function StaffManagement() {
  // State management
  const [staff, setStaff] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [performance, setPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({});
  const [editingSchedule, setEditingSchedule] = useState<Partial<StaffSchedule>>({});

  // Load data on component mount
  useEffect(() => {
    loadStaffData();
  }, []);

  // Sprint B: Load staff data, schedules, and performance metrics
  const loadStaffData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load staff and schedules
      const [staffData, schedulesData] = await Promise.all([
        apiService.getStaff(),
        apiService.getStaffSchedules()
      ]);
      
      setStaff(staffData);
      setSchedules(schedulesData);
      
      // Mock performance data - in real implementation would come from analytics
      const mockPerformance: StaffPerformance[] = staffData.map((s, index) => ({
        staff_id: s.id,
        total_appointments: 45 + index * 10,
        completed_appointments: 42 + index * 9,
        total_revenue: 3200 + index * 500,
        average_rating: 4.2 + (index * 0.2),
        utilization_rate: 75 + (index * 5),
        commission_earned: 480 + index * 75
      }));
      
      setPerformance(mockPerformance);
      
    } catch (err) {
      console.error('Error loading staff data:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  // Sprint B: Create or update staff member
  const handleSaveStaff = async () => {
    try {
      if (editingStaff.id) {
        await apiService.updateStaffMember(editingStaff.id, editingStaff);
      } else {
        await apiService.createStaffMember(editingStaff);
      }
      
      await loadStaffData();
      setShowStaffDialog(false);
      setEditingStaff({});
      
    } catch (err) {
      console.error('Error saving staff:', err);
      setError('Failed to save staff member');
    }
  };

  // Sprint B: Create or update staff schedule
  const handleSaveSchedule = async () => {
    try {
      if (editingSchedule.id) {
        await apiService.updateStaffSchedule(editingSchedule.id, editingSchedule);
      } else {
        await apiService.createStaffSchedule(editingSchedule);
      }
      
      await loadStaffData();
      setShowScheduleDialog(false);
      setEditingSchedule({});
      
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Failed to save schedule');
    }
  };

  // Helper functions
  const getStaffSchedule = (staffId: string): StaffSchedule[] => {
    return schedules.filter(s => s.staff_id === staffId);
  };

  const getStaffPerformance = (staffId: string): StaffPerformance | undefined => {
    return performance.find(p => p.staff_id === staffId);
  };

  const getPositionBadgeColor = (position: Staff['position']): string => {
    switch (position) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'senior_stylist': return 'bg-blue-100 text-blue-800';
      case 'stylist': return 'bg-green-100 text-green-800';
      case 'assistant': return 'bg-yellow-100 text-yellow-800';
      case 'trainee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[dayOfWeek];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading staff data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B: Staff Management</h1>
          <Badge variant="outline" className="bg-green-50">
            <Users className="w-3 h-3 mr-1" />
            Advanced Staff System
          </Badge>
        </div>
        
        <Button onClick={() => {
          setEditingStaff({
            position: 'stylist',
            weekly_hours: 40,
            is_active: true,
            specialties: []
          });
          setShowStaffDialog(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mitarbeiter
        </Button>
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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="schedules">Arbeitszeiten</TabsTrigger>
          <TabsTrigger value="performance">Leistung</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Staff Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => {
              const perf = getStaffPerformance(member.id);
              const schedule = getStaffSchedule(member.id);
              
              return (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.full_name}</h3>
                          <Badge className={getPositionBadgeColor(member.position)}>
                            {member.position.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStaff(member);
                            setShowStaffDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSchedule({ staff_id: member.id });
                            setShowScheduleDialog(true);
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                    
                    {/* Specialties */}
                    <div>
                      <div className="text-sm font-medium mb-1">Spezialisierungen:</div>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    {perf && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{perf.completed_appointments}</div>
                          <div className="text-xs text-gray-500">Termine</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{perf.utilization_rate}%</div>
                          <div className="text-xs text-gray-500">Auslastung</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Status */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center">
                        {member.is_active ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className="text-sm">
                          {member.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {member.weekly_hours}h/Woche
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {staff.map((member) => {
              const memberSchedules = getStaffSchedule(member.id);
              
              return (
                <Card key={member.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{member.full_name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSchedule({ 
                            staff_id: member.id,
                            day_of_week: 1,
                            start_time: '09:00',
                            end_time: '17:00',
                            is_regular: true,
                            is_available: true
                          });
                          setShowScheduleDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Schedule
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {memberSchedules.length > 0 ? (
                        memberSchedules.map((schedule) => (
                          <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{getDayName(schedule.day_of_week)}</div>
                              <div className="text-sm text-gray-600">
                                {schedule.start_time} - {schedule.end_time}
                                {schedule.break_start && schedule.break_end && (
                                  <span className="ml-2 text-xs">
                                    (Pause: {schedule.break_start} - {schedule.break_end})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={schedule.is_available ? 'default' : 'secondary'}>
                                {schedule.is_available ? 'Verfügbar' : 'Nicht verfügbar'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setShowScheduleDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          Keine Arbeitszeiten definiert
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500" />
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
                  <BarChart3 className="w-8 h-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Ø Auslastung</p>
                    <p className="text-2xl font-bold">
                      {Math.round(performance.reduce((acc, p) => acc + p.utilization_rate, 0) / performance.length)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Gesamt Umsatz</p>
                    <p className="text-2xl font-bold">
                      CHF {performance.reduce((acc, p) => acc + p.total_revenue, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Ø Bewertung</p>
                    <p className="text-2xl font-bold">
                      {(performance.reduce((acc, p) => acc + p.average_rating, 0) / performance.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Leistungsübersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mitarbeiter</th>
                      <th className="text-left p-2">Termine</th>
                      <th className="text-left p-2">Umsatz</th>
                      <th className="text-left p-2">Provision</th>
                      <th className="text-left p-2">Auslastung</th>
                      <th className="text-left p-2">Bewertung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((perf) => {
                      const member = staff.find(s => s.id === perf.staff_id);
                      return (
                        <tr key={perf.staff_id} className="border-b">
                          <td className="p-2">
                            <div className="font-medium">{member?.full_name}</div>
                            <div className="text-sm text-gray-500">{member?.position}</div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{perf.completed_appointments}</div>
                            <div className="text-sm text-gray-500">von {perf.total_appointments}</div>
                          </td>
                          <td className="p-2 font-medium">
                            CHF {perf.total_revenue.toLocaleString()}
                          </td>
                          <td className="p-2 font-medium text-green-600">
                            CHF {perf.commission_earned.toLocaleString()}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${perf.utilization_rate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{perf.utilization_rate}%</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <Award className="w-4 h-4 text-yellow-500 mr-1" />
                              <span>{perf.average_rating.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
            <p>Detaillierte Analysen und Berichte werden in Sprint C implementiert</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Staff Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStaff.id ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
            </DialogTitle>
            <DialogDescription>
              Sprint B: Erweiterte Mitarbeiterverwaltung mit Spezialisierungen
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Name</Label>
              <Input
                id="full_name"
                value={editingStaff.full_name || ''}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  full_name: e.target.value
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={editingStaff.email || ''}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={editingStaff.phone || ''}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  phone: e.target.value
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Select
                value={editingStaff.position}
                onValueChange={(value: Staff['position']) => setEditingStaff(prev => ({
                  ...prev,
                  position: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Inhaber</SelectItem>
                  <SelectItem value="senior_stylist">Senior Stylist</SelectItem>
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="assistant">Assistent</SelectItem>
                  <SelectItem value="trainee">Auszubildender</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="weekly_hours">Wochenstunden</Label>
              <Input
                id="weekly_hours"
                type="number"
                value={editingStaff.weekly_hours || ''}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  weekly_hours: parseInt(e.target.value) || 0
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="hourly_rate">Stundenlohn (CHF)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={editingStaff.hourly_rate || ''}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  hourly_rate: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="specialties">Spezialisierungen (komma-getrennt)</Label>
              <Input
                id="specialties"
                value={(editingStaff.specialties || []).join(', ')}
                onChange={(e) => setEditingStaff(prev => ({
                  ...prev,
                  specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }))}
                placeholder="schnitt, farbe, bart, styling"
              />
            </div>
            
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editingStaff.is_active}
                onCheckedChange={(checked) => setEditingStaff(prev => ({
                  ...prev,
                  is_active: checked
                }))}
              />
              <Label htmlFor="is_active">Aktiv</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStaffDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveStaff}>
              {editingStaff.id ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arbeitszeit verwalten</DialogTitle>
            <DialogDescription>
              Sprint B: Detaillierte Arbeitszeiten mit Pausen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="day_of_week">Wochentag</Label>
              <Select
                value={editingSchedule.day_of_week?.toString()}
                onValueChange={(value) => setEditingSchedule(prev => ({
                  ...prev,
                  day_of_week: parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Montag</SelectItem>
                  <SelectItem value="2">Dienstag</SelectItem>
                  <SelectItem value="3">Mittwoch</SelectItem>
                  <SelectItem value="4">Donnerstag</SelectItem>
                  <SelectItem value="5">Freitag</SelectItem>
                  <SelectItem value="6">Samstag</SelectItem>
                  <SelectItem value="0">Sonntag</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Arbeitsbeginn</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={editingSchedule.start_time || ''}
                  onChange={(e) => setEditingSchedule(prev => ({
                    ...prev,
                    start_time: e.target.value
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_time">Arbeitsende</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={editingSchedule.end_time || ''}
                  onChange={(e) => setEditingSchedule(prev => ({
                    ...prev,
                    end_time: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="break_start">Pausenbeginn (optional)</Label>
                <Input
                  id="break_start"
                  type="time"
                  value={editingSchedule.break_start || ''}
                  onChange={(e) => setEditingSchedule(prev => ({
                    ...prev,
                    break_start: e.target.value
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="break_end">Pausenende (optional)</Label>
                <Input
                  id="break_end"
                  type="time"
                  value={editingSchedule.break_end || ''}
                  onChange={(e) => setEditingSchedule(prev => ({
                    ...prev,
                    break_end: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={editingSchedule.is_available}
                onCheckedChange={(checked) => setEditingSchedule(prev => ({
                  ...prev,
                  is_available: checked
                }))}
              />
              <Label htmlFor="is_available">Verfügbar für Termine</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveSchedule}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}