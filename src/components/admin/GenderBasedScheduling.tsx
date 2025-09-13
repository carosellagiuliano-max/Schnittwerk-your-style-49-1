/**
 * Sprint B Week 6: Gender-Based Scheduling Optimization
 * Intelligent appointment scheduling based on gender preferences and staff specialties
 * Based on PLAN.md Sprint B requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Settings,
  Zap,
  User,
  UserCheck,
  Scissors,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  apiService, 
  type Appointment, 
  type Staff, 
  type Customer,
  type Service,
  type TimeSlot
} from '@/services/api';

// Gender-based scheduling interfaces
interface GenderSchedulingRule {
  id: string;
  name: string;
  customer_gender: 'female' | 'male' | 'child' | 'other';
  preferred_staff_gender?: 'female' | 'male';
  preferred_services: string[];
  time_preferences: {
    preferred_days: number[]; // 0-6 (Sunday-Saturday)
    preferred_hours: string[]; // ['09:00', '10:00', ...]
    avoid_hours?: string[];
  };
  is_active: boolean;
  priority: number; // 1-10, higher = more important
}

interface SchedulingOptimization {
  appointment_id: string;
  customer_id: string;
  current_staff_id: string;
  suggested_staff_id: string;
  optimization_reason: string;
  improvement_score: number;
  benefits: string[];
}

interface GenderStats {
  female_customers: number;
  male_customers: number;
  child_customers: number;
  female_staff: number;
  male_staff: number;
  gender_match_rate: number;
  specialty_match_rate: number;
  optimization_opportunities: number;
}

export function GenderBasedScheduling() {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedulingRules, setSchedulingRules] = useState<GenderSchedulingRule[]>([]);
  const [optimizations, setOptimizations] = useState<SchedulingOptimization[]>([]);
  const [stats, setStats] = useState<GenderStats>({
    female_customers: 0,
    male_customers: 0,
    child_customers: 0,
    female_staff: 0,
    male_staff: 0,
    gender_match_rate: 0,
    specialty_match_rate: 0,
    optimization_opportunities: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(true);
  const [editingRule, setEditingRule] = useState<Partial<GenderSchedulingRule>>({});

  // Load data on component mount
  useEffect(() => {
    loadGenderSchedulingData();
    loadDefaultRules();
  }, []);

  // Auto-optimize every hour if enabled
  useEffect(() => {
    if (!autoOptimizeEnabled) return;
    
    const interval = setInterval(() => {
      analyzeSchedulingOptimizations();
    }, 3600000); // 1 hour
    
    return () => clearInterval(interval);
  }, [appointments, customers, staff, autoOptimizeEnabled]);

  // Sprint B Week 6: Load gender scheduling data
  const loadGenderSchedulingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load current week's appointments
      const startDate = format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      const [appointmentsData, customersData, staffData, servicesData] = await Promise.all([
        apiService.getAppointmentsByDateRange(startDate, endDate),
        apiService.getCustomers(),
        apiService.getStaff(),
        apiService.getServices()
      ]);
      
      setAppointments(appointmentsData);
      setCustomers(customersData);
      setStaff(staffData);
      setServices(servicesData);
      
      // Calculate gender statistics
      calculateGenderStats(appointmentsData, customersData, staffData);
      
      // Analyze scheduling optimizations
      analyzeSchedulingOptimizations();
      
    } catch (err) {
      console.error('Error loading gender scheduling data:', err);
      setError('Failed to load gender scheduling data');
    } finally {
      setLoading(false);
    }
  };

  // Sprint B Week 6: Load default scheduling rules
  const loadDefaultRules = () => {
    const defaultRules: GenderSchedulingRule[] = [
      {
        id: 'rule_female_preference',
        name: 'Female Customer Preference',
        customer_gender: 'female',
        preferred_staff_gender: 'female',
        preferred_services: ['schnitt', 'farbe', 'styling'],
        time_preferences: {
          preferred_days: [1, 2, 3, 4, 5], // Monday to Friday
          preferred_hours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
        },
        is_active: true,
        priority: 8
      },
      {
        id: 'rule_male_efficiency',
        name: 'Male Customer Efficiency',
        customer_gender: 'male',
        preferred_services: ['schnitt', 'bart'],
        time_preferences: {
          preferred_days: [1, 2, 3, 4, 5, 6], // Monday to Saturday
          preferred_hours: ['08:00', '09:00', '17:00', '18:00'],
          avoid_hours: ['12:00', '13:00'] // Lunch hours
        },
        is_active: true,
        priority: 6
      },
      {
        id: 'rule_child_safety',
        name: 'Child Customer Safety',
        customer_gender: 'child',
        preferred_staff_gender: 'female',
        preferred_services: ['kinderschnitt'],
        time_preferences: {
          preferred_days: [6, 0], // Saturday and Sunday
          preferred_hours: ['10:00', '11:00', '14:00', '15:00']
        },
        is_active: true,
        priority: 9
      },
      {
        id: 'rule_senior_comfort',
        name: 'Senior Customer Comfort',
        customer_gender: 'other',
        preferred_staff_gender: 'female',
        preferred_services: ['schnitt', 'waschen', 'föhnen'],
        time_preferences: {
          preferred_days: [1, 2, 3, 4], // Monday to Thursday
          preferred_hours: ['09:00', '10:00', '11:00'],
          avoid_hours: ['17:00', '18:00'] // Late hours
        },
        is_active: true,
        priority: 7
      }
    ];
    
    setSchedulingRules(defaultRules);
  };

  // Sprint B Week 6: Calculate gender-based statistics
  const calculateGenderStats = (appointmentsData: Appointment[], customersData: Customer[], staffData: Staff[]) => {
    const femaleCustomers = customersData.filter(c => c.gender === 'female').length;
    const maleCustomers = customersData.filter(c => c.gender === 'male').length;
    const childCustomers = customersData.filter(c => c.gender === 'child').length;
    
    // Mock staff gender data (would come from staff profiles in real implementation)
    const femaleStaff = staffData.filter(s => s.specialties.includes('styling') || s.position === 'stylist').length;
    const maleStaff = staffData.length - femaleStaff;
    
    // Calculate match rates
    let genderMatches = 0;
    let specialtyMatches = 0;
    
    appointmentsData.forEach(appointment => {
      const customer = customersData.find(c => c.id === appointment.customer_id);
      const staffMember = staffData.find(s => s.id === appointment.staff_id);
      
      if (customer && staffMember) {
        // Check gender match (simplified logic)
        if ((customer.gender === 'female' && staffMember.specialties.includes('styling')) ||
            (customer.gender === 'male' && staffMember.specialties.includes('bart')) ||
            (customer.gender === 'child' && staffMember.specialties.includes('styling'))) {
          genderMatches++;
        }
        
        // Check specialty match
        if (staffMember.specialties.some(specialty => 
          appointment.service_id.toLowerCase().includes(specialty)
        )) {
          specialtyMatches++;
        }
      }
    });
    
    const genderMatchRate = appointmentsData.length > 0 ? (genderMatches / appointmentsData.length) * 100 : 0;
    const specialtyMatchRate = appointmentsData.length > 0 ? (specialtyMatches / appointmentsData.length) * 100 : 0;
    
    setStats({
      female_customers: femaleCustomers,
      male_customers: maleCustomers,
      child_customers: childCustomers,
      female_staff: femaleStaff,
      male_staff: maleStaff,
      gender_match_rate: genderMatchRate,
      specialty_match_rate: specialtyMatchRate,
      optimization_opportunities: Math.max(0, appointmentsData.length - genderMatches - specialtyMatches)
    });
  };

  // Sprint B Week 6: Analyze scheduling optimizations
  const analyzeSchedulingOptimizations = () => {
    const optimizationSuggestions: SchedulingOptimization[] = [];
    
    appointments.forEach(appointment => {
      const customer = customers.find(c => c.id === appointment.customer_id);
      const currentStaff = staff.find(s => s.id === appointment.staff_id);
      
      if (!customer || !currentStaff) return;
      
      // Find applicable rules for this customer
      const applicableRules = schedulingRules.filter(rule => 
        rule.is_active && 
        (rule.customer_gender === customer.gender || rule.customer_gender === 'other')
      );
      
      applicableRules.forEach(rule => {
        // Check if current assignment violates rule preferences
        let violationScore = 0;
        const benefits: string[] = [];
        
        // Check staff gender preference
        if (rule.preferred_staff_gender) {
          const staffGender = getStaffGender(currentStaff);
          if (staffGender !== rule.preferred_staff_gender) {
            violationScore += rule.priority * 2;
            benefits.push(`Match ${rule.preferred_staff_gender} staff preference`);
          }
        }
        
        // Check service specialty match
        const hasSpecialtyMatch = currentStaff.specialties.some(specialty =>
          rule.preferred_services.includes(specialty)
        );
        
        if (!hasSpecialtyMatch) {
          violationScore += rule.priority;
          benefits.push('Better service specialty match');
        }
        
        // Check time preferences
        const appointmentDay = new Date(appointment.appointment_date).getDay();
        const appointmentHour = appointment.start_time;
        
        if (!rule.time_preferences.preferred_days.includes(appointmentDay)) {
          violationScore += rule.priority * 0.5;
          benefits.push('Preferred day alignment');
        }
        
        if (rule.time_preferences.avoid_hours?.includes(appointmentHour)) {
          violationScore += rule.priority * 1.5;
          benefits.push('Avoid non-preferred hours');
        }
        
        // Find better staff member if violation score is significant
        if (violationScore > 5) {
          const betterStaff = findBetterStaffMatch(customer, appointment, rule);
          
          if (betterStaff && betterStaff.id !== currentStaff.id) {
            optimizationSuggestions.push({
              appointment_id: appointment.id,
              customer_id: customer.id,
              current_staff_id: currentStaff.id,
              suggested_staff_id: betterStaff.id,
              optimization_reason: rule.name,
              improvement_score: violationScore,
              benefits
            });
          }
        }
      });
    });
    
    // Sort by improvement score and remove duplicates
    const uniqueOptimizations = optimizationSuggestions
      .sort((a, b) => b.improvement_score - a.improvement_score)
      .filter((opt, index, arr) => 
        arr.findIndex(o => o.appointment_id === opt.appointment_id) === index
      );
    
    setOptimizations(uniqueOptimizations.slice(0, 10)); // Top 10 optimizations
  };

  // Helper function to determine staff gender (simplified)
  const getStaffGender = (staffMember: Staff): 'female' | 'male' => {
    // In real implementation, this would come from staff profile
    // For now, use heuristics based on specialties and position
    if (staffMember.specialties.includes('styling') || 
        staffMember.specialties.includes('farbe') ||
        staffMember.position === 'stylist') {
      return 'female';
    }
    return 'male';
  };

  // Find better staff match based on rules
  const findBetterStaffMatch = (customer: Customer, appointment: Appointment, rule: GenderSchedulingRule): Staff | null => {
    const availableStaff = staff.filter(s => s.is_active);
    
    let bestMatch: Staff | null = null;
    let bestScore = 0;
    
    availableStaff.forEach(staffMember => {
      let score = 0;
      
      // Gender preference match
      if (rule.preferred_staff_gender) {
        const staffGender = getStaffGender(staffMember);
        if (staffGender === rule.preferred_staff_gender) {
          score += rule.priority * 2;
        }
      }
      
      // Specialty match
      const specialtyMatches = staffMember.specialties.filter(specialty =>
        rule.preferred_services.includes(specialty)
      ).length;
      score += specialtyMatches * rule.priority;
      
      // Experience level (higher position = more experience)
      if (staffMember.position === 'senior_stylist') score += 3;
      if (staffMember.position === 'owner') score += 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = staffMember;
      }
    });
    
    return bestMatch;
  };

  // Apply optimization suggestion
  const applyOptimization = async (optimization: SchedulingOptimization) => {
    try {
      const appointment = appointments.find(a => a.id === optimization.appointment_id);
      if (!appointment) return;
      
      await apiService.updateAppointment(optimization.appointment_id, {
        staff_id: optimization.suggested_staff_id
      });
      
      // Remove applied optimization from list
      setOptimizations(prev => prev.filter(o => o.appointment_id !== optimization.appointment_id));
      
      // Refresh data
      await loadGenderSchedulingData();
      
    } catch (err) {
      console.error('Error applying optimization:', err);
      setError('Failed to apply optimization');
    }
  };

  // Save scheduling rule
  const handleSaveRule = () => {
    try {
      const newRule: GenderSchedulingRule = {
        id: editingRule.id || `rule_${Date.now()}`,
        name: editingRule.name || '',
        customer_gender: editingRule.customer_gender || 'female',
        preferred_staff_gender: editingRule.preferred_staff_gender,
        preferred_services: editingRule.preferred_services || [],
        time_preferences: editingRule.time_preferences || {
          preferred_days: [],
          preferred_hours: []
        },
        is_active: editingRule.is_active ?? true,
        priority: editingRule.priority || 5
      };
      
      const updatedRules = editingRule.id 
        ? schedulingRules.map(r => r.id === editingRule.id ? newRule : r)
        : [...schedulingRules, newRule];
      
      setSchedulingRules(updatedRules);
      setShowRuleDialog(false);
      setEditingRule({});
      
      // Re-analyze with new rules
      analyzeSchedulingOptimizations();
      
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save rule');
    }
  };

  // Helper functions
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'female': return <User className="w-4 h-4 text-pink-500" />;
      case 'male': return <User className="w-4 h-4 text-blue-500" />;
      case 'child': return <User className="w-4 h-4 text-green-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-orange-100 text-orange-800';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading gender scheduling data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B: Gender-Based Scheduling</h1>
          <Badge variant="outline" className="bg-purple-50">
            <Target className="w-3 h-3 mr-1" />
            Smart Optimization
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoOptimizeEnabled}
              onCheckedChange={setAutoOptimizeEnabled}
            />
            <Label>Auto-Optimize</Label>
          </div>
          
          <Button variant="outline" onClick={analyzeSchedulingOptimizations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Analyze
          </Button>
          
          <Button onClick={() => {
            setEditingRule({
              customer_gender: 'female',
              preferred_services: [],
              time_preferences: {
                preferred_days: [],
                preferred_hours: []
              },
              is_active: true,
              priority: 5
            });
            setShowRuleDialog(true);
          }}>
            <Settings className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-pink-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Female Customers</p>
                <p className="text-2xl font-bold">{stats.female_customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Male Customers</p>
                <p className="text-2xl font-bold">{stats.male_customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Child Customers</p>
                <p className="text-2xl font-bold">{stats.child_customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Gender Match Rate</p>
                <p className="text-2xl font-bold">{stats.gender_match_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">{optimizations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimizations">
            Optimizations ({optimizations.length})
          </TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Week Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Current Week Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Gender Match Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${stats.gender_match_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.gender_match_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Specialty Match Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${stats.specialty_match_rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{stats.specialty_match_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Overall Optimization</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${((stats.gender_match_rate + stats.specialty_match_rate) / 2)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {((stats.gender_match_rate + stats.specialty_match_rate) / 2).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Optimizations */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizations.slice(0, 3).map((optimization) => {
                    const customer = customers.find(c => c.id === optimization.customer_id);
                    const currentStaff = staff.find(s => s.id === optimization.current_staff_id);
                    const suggestedStaff = staff.find(s => s.id === optimization.suggested_staff_id);
                    
                    return (
                      <div key={optimization.appointment_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          {getGenderIcon(customer?.gender || '')}
                          <div>
                            <div className="font-medium">{customer?.full_name}</div>
                            <div className="text-sm text-gray-600">
                              {currentStaff?.full_name} → {suggestedStaff?.full_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            +{optimization.improvement_score}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => applyOptimization(optimization)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {optimizations.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>All appointments are optimally scheduled!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          <div className="space-y-4">
            {optimizations.map((optimization) => {
              const appointment = appointments.find(a => a.id === optimization.appointment_id);
              const customer = customers.find(c => c.id === optimization.customer_id);
              const currentStaff = staff.find(s => s.id === optimization.current_staff_id);
              const suggestedStaff = staff.find(s => s.id === optimization.suggested_staff_id);
              
              return (
                <Card key={optimization.appointment_id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getGenderIcon(customer?.gender || '')}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{customer?.full_name}</h3>
                            <Badge variant="outline">{optimization.optimization_reason}</Badge>
                            <Badge className={getPriorityColor(optimization.improvement_score)}>
                              Score: {optimization.improvement_score}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <div className="font-medium">Current Assignment</div>
                              <div>{currentStaff?.full_name} ({currentStaff?.position})</div>
                            </div>
                            
                            <div>
                              <div className="font-medium">Suggested Assignment</div>
                              <div>{suggestedStaff?.full_name} ({suggestedStaff?.position})</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-sm mb-1">Benefits:</div>
                            <div className="flex flex-wrap gap-1">
                              {optimization.benefits.map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {appointment && (
                            <div className="text-sm text-gray-500 mt-2">
                              Appointment: {format(new Date(appointment.appointment_date), 'dd.MM.yyyy')} at {appointment.start_time}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => applyOptimization(optimization)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {optimizations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No optimizations needed</h3>
                <p>All appointments are perfectly scheduled according to gender and specialty preferences!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {schedulingRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getGenderIcon(rule.customer_gender)}
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {rule.customer_gender} customers • Priority: {rule.priority}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={rule.is_active} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Preferred Staff Gender:</Label>
                      <p className="text-sm text-gray-700">
                        {rule.preferred_staff_gender || 'Any'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Preferred Services:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.preferred_services.map((service, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Time Preferences:</Label>
                      <p className="text-sm text-gray-700">
                        Days: {rule.time_preferences.preferred_days.map(d => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d]).join(', ')}
                      </p>
                      <p className="text-sm text-gray-700">
                        Hours: {rule.time_preferences.preferred_hours.slice(0, 3).join(', ')}
                        {rule.time_preferences.preferred_hours.length > 3 && '...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
            <p>Detailed gender-based scheduling analytics will be implemented in Sprint C</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule.id ? 'Edit Scheduling Rule' : 'New Scheduling Rule'}
            </DialogTitle>
            <DialogDescription>
              Sprint B Week 6: Define gender-based scheduling preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={editingRule.name || ''}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="customer_gender">Customer Gender</Label>
                <Select
                  value={editingRule.customer_gender}
                  onValueChange={(value: any) => setEditingRule(prev => ({
                    ...prev,
                    customer_gender: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="other">Other/Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferred_staff_gender">Preferred Staff Gender (Optional)</Label>
                <Select
                  value={editingRule.preferred_staff_gender || ''}
                  onValueChange={(value: any) => setEditingRule(prev => ({
                    ...prev,
                    preferred_staff_gender: value || undefined
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={editingRule.priority || ''}
                  onChange={(e) => setEditingRule(prev => ({
                    ...prev,
                    priority: parseInt(e.target.value) || 5
                  }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingRule.is_active}
                onCheckedChange={(checked) => setEditingRule(prev => ({
                  ...prev,
                  is_active: checked
                }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              {editingRule.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}