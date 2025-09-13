/**
 * Sprint B: Advanced Waiting List Manager
 * Intelligent waiting list with automatic appointment conversion
 * Based on PLAN.md Sprint B requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  User, 
  Calendar, 
  Bell, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Star,
  Mail,
  MessageSquare,
  Zap,
  Users,
  TrendingUp,
  Target,
  RefreshCw
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  apiService, 
  type WaitingListEntry, 
  type TimeSlot, 
  type Customer,
  type Service,
  type Staff
} from '@/services/api';

// Extended waiting list entry with customer and service data
interface ExtendedWaitingListEntry extends WaitingListEntry {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
  staff_name?: string;
  waiting_days?: number;
  urgency_score?: number;
}

// Suggested appointment for waiting list conversion
interface AppointmentSuggestion {
  timeSlot: TimeSlot;
  score: number;
  reasons: string[];
}

export function WaitingListManager() {
  // State management
  const [waitingList, setWaitingList] = useState<ExtendedWaitingListEntry[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [suggestions, setSuggestions] = useState<AppointmentSuggestion[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedEntry, setSelectedEntry] = useState<ExtendedWaitingListEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(true);
  
  // New entry form state
  const [newEntry, setNewEntry] = useState<Partial<WaitingListEntry>>({
    flexible_dates: true,
    flexible_times: true,
    priority: 'medium',
    max_wait_days: 14,
    notify_email: true,
    notify_sms: false
  });

  // Load data on component mount
  useEffect(() => {
    loadWaitingListData();
  }, []);

  // Auto-search for available slots every 30 seconds if enabled
  useEffect(() => {
    if (!autoSearchEnabled) return;
    
    const interval = setInterval(() => {
      searchForAvailableSlots();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [waitingList, autoSearchEnabled]);

  // Sprint B: Load waiting list and related data
  const loadWaitingListData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all required data in parallel
      const [waitingListData, customersData, servicesData, staffData] = await Promise.all([
        apiService.getWaitingList(),
        apiService.getCustomers(),
        apiService.getServices(),
        apiService.getStaff()
      ]);
      
      // Enhance waiting list entries with customer and service data
      const enhancedEntries: ExtendedWaitingListEntry[] = waitingListData.map(entry => {
        const customer = customersData.find(c => c.id === entry.customer_id);
        const service = servicesData.find(s => s.id === entry.service_id);
        const staffMember = staffData.find(s => s.id === entry.preferred_staff_id);
        const waitingDays = differenceInDays(new Date(), new Date(entry.created_at));
        
        return {
          ...entry,
          customer_name: customer?.full_name || 'Unknown Customer',
          customer_email: customer?.email,
          customer_phone: customer?.phone,
          service_name: service?.name || 'Unknown Service',
          staff_name: staffMember?.full_name,
          waiting_days: waitingDays,
          urgency_score: calculateUrgencyScore(entry, waitingDays)
        };
      });
      
      setWaitingList(enhancedEntries);
      setCustomers(customersData);
      setServices(servicesData);
      setStaff(staffData);
      
    } catch (err) {
      console.error('Error loading waiting list data:', err);
      setError('Failed to load waiting list data');
    } finally {
      setLoading(false);
    }
  };

  // Sprint B: Calculate urgency score for prioritization
  const calculateUrgencyScore = (entry: WaitingListEntry, waitingDays: number): number => {
    let score = 0;
    
    // Base score from priority
    switch (entry.priority) {
      case 'urgent': score += 100; break;
      case 'high': score += 75; break;
      case 'medium': score += 50; break;
      case 'low': score += 25; break;
    }
    
    // Add points for waiting time
    score += waitingDays * 5;
    
    // Add points if approaching max wait days
    const daysRemaining = entry.max_wait_days - waitingDays;
    if (daysRemaining <= 3) score += 50;
    if (daysRemaining <= 1) score += 100;
    
    // Deduct points for inflexibility
    if (!entry.flexible_dates) score -= 20;
    if (!entry.flexible_times) score -= 20;
    
    return Math.max(0, score);
  };

  // Sprint B: Search for available slots that match waiting list preferences
  const searchForAvailableSlots = async () => {
    try {
      const allSuggestions: AppointmentSuggestion[] = [];
      
      for (const entry of waitingList) {
        // Search for slots around preferred date
        const searchDates = entry.flexible_dates 
          ? [
              entry.preferred_date || format(new Date(), 'yyyy-MM-dd'),
              format(addDays(new Date(entry.preferred_date || new Date()), 1), 'yyyy-MM-dd'),
              format(addDays(new Date(entry.preferred_date || new Date()), -1), 'yyyy-MM-dd')
            ]
          : [entry.preferred_date || format(new Date(), 'yyyy-MM-dd')];
        
        for (const date of searchDates) {
          const slots = await apiService.getAvailableTimeSlots(
            date, 
            entry.service_id, 
            entry.preferred_staff_id
          );
          
          // Score each slot based on entry preferences
          const scoredSlots = slots.map(slot => ({
            timeSlot: slot,
            score: scoreTimeSlot(slot, entry),
            reasons: generateScoreReasons(slot, entry)
          }));
          
          allSuggestions.push(...scoredSlots);
        }
      }
      
      // Sort by score and take top suggestions
      allSuggestions.sort((a, b) => b.score - a.score);
      setSuggestions(allSuggestions.slice(0, 10));
      
    } catch (err) {
      console.error('Error searching for available slots:', err);
    }
  };

  // Sprint B: Score time slot based on customer preferences
  const scoreTimeSlot = (slot: TimeSlot, entry: ExtendedWaitingListEntry): number => {
    let score = entry.urgency_score || 50;
    
    // Prefer exact staff match
    if (entry.preferred_staff_id === slot.staff_id) score += 50;
    
    // Prefer time within preferred range
    if (entry.preferred_time_start && entry.preferred_time_end) {
      const slotTime = parseInt(slot.start_time.replace(':', ''));
      const prefStart = parseInt(entry.preferred_time_start.replace(':', ''));
      const prefEnd = parseInt(entry.preferred_time_end.replace(':', ''));
      
      if (slotTime >= prefStart && slotTime <= prefEnd) {
        score += 30;
      }
    }
    
    // Prefer exact date match
    if (entry.preferred_date === slot.date) score += 20;
    
    return score;
  };

  // Generate human-readable reasons for score
  const generateScoreReasons = (slot: TimeSlot, entry: ExtendedWaitingListEntry): string[] => {
    const reasons = [];
    
    if (entry.preferred_staff_id === slot.staff_id) {
      reasons.push('Preferred staff member');
    }
    
    if (entry.preferred_date === slot.date) {
      reasons.push('Exact date match');
    }
    
    if (entry.priority === 'urgent' || entry.priority === 'high') {
      reasons.push('High priority customer');
    }
    
    if ((entry.waiting_days || 0) > 7) {
      reasons.push('Long waiting time');
    }
    
    return reasons;
  };

  // Sprint B: Convert waiting list entry to appointment
  const handleConvertToAppointment = async (entryId: string, timeSlot: TimeSlot) => {
    try {
      await apiService.convertWaitingListToAppointment(entryId, timeSlot);
      await loadWaitingListData(); // Refresh data
      setShowConvertDialog(false);
      setSelectedEntry(null);
      
    } catch (err) {
      console.error('Error converting to appointment:', err);
      setError('Failed to convert waiting list entry to appointment');
    }
  };

  // Sprint B: Add new entry to waiting list
  const handleAddToWaitingList = async () => {
    try {
      await apiService.addToWaitingList(newEntry);
      await loadWaitingListData();
      setShowAddDialog(false);
      
      // Reset form
      setNewEntry({
        flexible_dates: true,
        flexible_times: true,
        priority: 'medium',
        max_wait_days: 14,
        notify_email: true,
        notify_sms: false
      });
      
    } catch (err) {
      console.error('Error adding to waiting list:', err);
      setError('Failed to add to waiting list');
    }
  };

  // Helper functions
  const getPriorityColor = (priority: WaitingListEntry['priority']): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgencyScore: number) => {
    if (urgencyScore >= 150) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (urgencyScore >= 100) return <Star className="w-4 h-4 text-orange-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const filteredWaitingList = waitingList.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading waiting list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Sprint B: Waiting List Manager</h1>
          <Badge variant="outline" className="bg-purple-50">
            <Zap className="w-3 h-3 mr-1" />
            Intelligent Automation
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoSearchEnabled}
              onCheckedChange={setAutoSearchEnabled}
            />
            <Label>Auto-Search</Label>
          </div>
          
          <Button variant="outline" onClick={searchForAvailableSlots}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Search Slots
          </Button>
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add to Waiting List
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Waiting</p>
                <p className="text-2xl font-bold">{waitingList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold">
                  {waitingList.filter(e => e.priority === 'high' || e.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(waitingList.reduce((acc, e) => acc + (e.waiting_days || 0), 0) / waitingList.length || 0)} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Available Slots</p>
                <p className="text-2xl font-bold">{suggestions.length}</p>
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

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search customers or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          
          <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="waiting-list">
        <TabsList>
          <TabsTrigger value="waiting-list">Waiting List</TabsTrigger>
          <TabsTrigger value="suggestions">
            Smart Suggestions ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Waiting List Tab */}
        <TabsContent value="waiting-list" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredWaitingList.map((entry) => (
              <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getUrgencyIcon(entry.urgency_score || 0)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{entry.customer_name}</h3>
                          <Badge className={getPriorityColor(entry.priority)}>
                            {entry.priority}
                          </Badge>
                          {(entry.waiting_days || 0) > 7 && (
                            <Badge variant="destructive">
                              {entry.waiting_days} days waiting
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <div className="font-medium">Service</div>
                            <div>{entry.service_name}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Preferred Date</div>
                            <div>{entry.preferred_date ? format(new Date(entry.preferred_date), 'dd.MM.yyyy') : 'Flexible'}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Preferred Time</div>
                            <div>
                              {entry.preferred_time_start && entry.preferred_time_end 
                                ? `${entry.preferred_time_start} - ${entry.preferred_time_end}`
                                : 'Flexible'
                              }
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Staff Preference</div>
                            <div>{entry.staff_name || 'Any staff'}</div>
                          </div>
                        </div>
                        
                        {entry.customer_email && (
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-1" />
                            {entry.customer_email}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <div className="font-medium">Urgency Score</div>
                        <div className="text-lg font-bold text-orange-600">
                          {entry.urgency_score || 0}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowConvertDialog(true);
                          searchForAvailableSlots();
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Convert
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredWaitingList.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No entries in waiting list</h3>
                <p>All customers have been accommodated!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Smart Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {suggestions.map((suggestion, index) => {
              const entry = waitingList.find(e => e.preferred_staff_id === suggestion.timeSlot.staff_id);
              
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          <div>
                            <h3 className="font-semibold">
                              {format(new Date(suggestion.timeSlot.date), 'EEEE, dd.MM.yyyy', { locale: de })}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {suggestion.timeSlot.start_time} - {suggestion.timeSlot.end_time} with {suggestion.timeSlot.staff_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestion.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Match Score: <span className="font-medium text-green-600">{suggestion.score}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Find best matching waiting list entry for this suggestion
                            const bestMatch = waitingList
                              .filter(e => !e.preferred_staff_id || e.preferred_staff_id === suggestion.timeSlot.staff_id)
                              .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0))[0];
                            
                            if (bestMatch) {
                              handleConvertToAppointment(bestMatch.id, suggestion.timeSlot);
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {suggestions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No smart suggestions available</h3>
                <p>Try searching for available slots or adjusting customer preferences</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add to Waiting List Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add to Waiting List</DialogTitle>
            <DialogDescription>
              Sprint B: Advanced waiting list with smart preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={newEntry.customer_id}
                onValueChange={(value) => setNewEntry(prev => ({
                  ...prev,
                  customer_id: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="service">Service</Label>
              <Select
                value={newEntry.service_id}
                onValueChange={(value) => setNewEntry(prev => ({
                  ...prev,
                  service_id: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="preferred_date">Preferred Date</Label>
              <Input
                id="preferred_date"
                type="date"
                value={newEntry.preferred_date || ''}
                onChange={(e) => setNewEntry(prev => ({
                  ...prev,
                  preferred_date: e.target.value
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newEntry.priority}
                onValueChange={(value: any) => setNewEntry(prev => ({
                  ...prev,
                  priority: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEntry.flexible_dates}
                  onCheckedChange={(checked) => setNewEntry(prev => ({
                    ...prev,
                    flexible_dates: checked
                  }))}
                />
                <Label>Flexible with dates</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEntry.flexible_times}
                  onCheckedChange={(checked) => setNewEntry(prev => ({
                    ...prev,
                    flexible_times: checked
                  }))}
                />
                <Label>Flexible with times</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEntry.notify_email}
                  onCheckedChange={(checked) => setNewEntry(prev => ({
                    ...prev,
                    notify_email: checked
                  }))}
                />
                <Label>Email notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEntry.notify_sms}
                  onCheckedChange={(checked) => setNewEntry(prev => ({
                    ...prev,
                    notify_sms: checked
                  }))}
                />
                <Label>SMS notifications</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToWaitingList}>
              Add to Waiting List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Appointment Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Convert to Appointment</DialogTitle>
            <DialogDescription>
              Available time slots for {selectedEntry?.customer_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {suggestions
              .filter(s => !selectedEntry?.preferred_staff_id || s.timeSlot.staff_id === selectedEntry.preferred_staff_id)
              .map((suggestion, index) => (
                <Card key={index} className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => selectedEntry && handleConvertToAppointment(selectedEntry.id, suggestion.timeSlot)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {format(new Date(suggestion.timeSlot.date), 'EEE, dd.MM.yyyy')}
                      </div>
                      <Badge variant="outline">Score: {suggestion.score}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {suggestion.timeSlot.start_time} - {suggestion.timeSlot.end_time}
                    </div>
                    
                    <div className="text-sm mb-2">
                      <strong>{suggestion.timeSlot.staff_name}</strong>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {suggestion.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {suggestions.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No available slots found. Try adjusting preferences or search again later.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}