import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Calendar, 
  Euro, 
  Star,
  Crown,
  Gem,
  Award,
  UserPlus,
  Filter,
  SortAsc,
  SortDesc,
  Phone,
  Mail,
  Baby,
  User,
  Users
} from 'lucide-react';
import { CustomerDetailModal } from './CustomerDetailModal';
import { AddCustomerModal } from './AddCustomerModal';
import { apiService, type Customer } from '@/services/api';

const customerStatusConfig = {
  neu: { 
    label: 'Neu', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: UserPlus,
    requirement: 'Neukunde'
  },
  bronze: { 
    label: 'Bronze', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Award,
    requirement: 'CHF 250+ Umsatz'
  },
  silber: { 
    label: 'Silber', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Star,
    requirement: 'CHF 500+ Umsatz'
  },
  gold: { 
    label: 'Gold', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Crown,
    requirement: 'CHF 1200+ Umsatz'
  },
  diamant: { 
    label: 'Diamant', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Gem,
    requirement: 'CHF 1800+ Umsatz'
  }
};

// Helper interface for extended customer data with calculated fields
interface ExtendedCustomer extends Customer {
  appointments?: number;
  nextAppointment?: string | null;
  hasAppointmentThisWeek?: boolean;
}

export function CustomerManagement() {
  const [customers, setCustomers] = useState<ExtendedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ExtendedCustomer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'full_name' | 'total_spent' | 'appointments' | 'last_visit'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load customers from API service
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const customerData = await apiService.getCustomers();
        
        // Extend customer data with calculated fields
        // TODO: In Sprint B, these will come from real appointment data
        const extendedCustomers: ExtendedCustomer[] = customerData.map((customer, index) => ({
          ...customer,
          appointments: Math.floor(Math.random() * 25) + 1, // Mock appointment count
          nextAppointment: index % 3 === 0 ? '2024-01-25' : null, // Mock next appointment
          hasAppointmentThisWeek: index % 4 === 0, // Mock this week appointment
        }));
        
        setCustomers(extendedCustomers);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setError('Fehler beim Laden der Kunden. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = 
        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm));
      
      const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
      const matchesStatus = statusFilter === 'all' || customer.loyalty_status === statusFilter;
      const matchesAppointment = 
        appointmentFilter === 'all' ||
        (appointmentFilter === 'hasNext' && customer.nextAppointment) ||
        (appointmentFilter === 'noNext' && !customer.nextAppointment) ||
        (appointmentFilter === 'thisWeek' && customer.hasAppointmentThisWeek);
      
      return matchesSearch && matchesGender && matchesStatus && matchesAppointment;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'full_name':
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        case 'total_spent':
          aValue = a.total_spent;
          bValue = b.total_spent;
          break;
        case 'appointments':
          aValue = a.appointments || 0;
          bValue = b.appointments || 0;
          break;
        case 'last_visit':
          aValue = a.last_visit ? new Date(a.last_visit) : new Date(0);
          bValue = b.last_visit ? new Date(b.last_visit) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getGenderStats = () => {
    const female = customers.filter(c => c.gender === 'female').length;
    const male = customers.filter(c => c.gender === 'male').length;
    const children = customers.filter(c => c.gender === 'child').length;
    return { female, male, children };
  };

  const genderStats = getGenderStats();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStatusBadge = (status: Customer['loyalty_status']) => {
    const config = customerStatusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'female': return User;
      case 'male': return Users;
      case 'child': return Baby;
      default: return User;
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'female': return 'text-pink-600';
      case 'male': return 'text-blue-600'; 
      case 'child': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Kunden werden geladen...</p>
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
      {/* Enhanced Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name, E-Mail, Telefon suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Gender Filter */}
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Geschlecht" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="female">Frauen ({genderStats.female})</SelectItem>
              <SelectItem value="male">Männer ({genderStats.male})</SelectItem>
              <SelectItem value="child">Kinder ({genderStats.children})</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(customerStatusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Appointment Filter */}
          <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Termine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Termine</SelectItem>
              <SelectItem value="hasNext">Hat nächsten Termin</SelectItem>
              <SelectItem value="noNext">Kein nächster Termin</SelectItem>
              <SelectItem value="thisWeek">Diese Woche</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_name">Name</SelectItem>
              <SelectItem value="total_spent">Umsatz</SelectItem>
              <SelectItem value="appointments">Termine</SelectItem>
              <SelectItem value="last_visit">Letzter Besuch</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          <Button className="gap-2" onClick={() => setShowAddCustomer(true)}>
            <Plus className="w-4 h-4" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics with Gender Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {/* Gender Stats */}
        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-pink-600" />
              <div>
                <p className="text-sm font-medium">Frauen</p>
                <p className="text-2xl font-bold">{genderStats.female}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Männer</p>
                <p className="text-2xl font-bold">{genderStats.male}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Kinder</p>
                <p className="text-2xl font-bold">{genderStats.children}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Stats */}
        {Object.entries(customerStatusConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = customers.filter(c => c.loyalty_status === key).length;
          
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${config.color.split(' ')[0]}/20`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{config.label}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kundenstamm ({filteredCustomers.length} Kunden)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Termine</TableHead>
                <TableHead>Umsatz</TableHead>
                <TableHead>Letzter Besuch</TableHead>
                <TableHead>Nächster Termin</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                 <TableRow key={customer.id}>
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <div className="relative">
                         <Avatar>
                           <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                         </Avatar>
                         <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                           customer.gender === 'female' ? 'bg-pink-500' : 
                           customer.gender === 'male' ? 'bg-blue-500' : 
                           customer.gender === 'child' ? 'bg-purple-500' : 'bg-gray-500'
                         }`} />
                       </div>
                       <div>
                         <div className="font-medium flex items-center gap-2">
                           {customer.full_name}
                           {customer.gender === 'child' && <Baby className="w-4 h-4 text-purple-600" />}
                         </div>
                         <div className="text-sm text-muted-foreground">
                           ID: {customer.id} • {
                             customer.gender === 'female' ? 'Frau' : 
                             customer.gender === 'male' ? 'Mann' : 
                             customer.gender === 'child' ? 'Kind' : 'Person'
                           }
                         </div>
                       </div>
                     </div>
                   </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.email}</div>
                      <div className="text-muted-foreground">{customer.phone || 'Keine Telefonnummer'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(customer.loyalty_status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {customer.appointments || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-semibold">
                      <Euro className="w-4 h-4 text-green-600" />
                      CHF {customer.total_spent.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.last_visit ? 
                        new Date(customer.last_visit).toLocaleDateString('de-CH') : 
                        'Noch kein Besuch'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.nextAppointment ? (
                      <div className="text-sm">
                        {new Date(customer.nextAppointment).toLocaleDateString('de-CH')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Kein Termin</span>
                    )}
                  </TableCell>
                   <TableCell>
                     <div className="flex gap-2">
                       <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(customer)}>
                         Termin
                       </Button>
                       <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(customer)}>
                         Details
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modals */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSave={(customerData) => {
            console.log('New customer:', customerData);
            // Here you would normally save to database
          }}
        />
      )}
    </div>
  );
}