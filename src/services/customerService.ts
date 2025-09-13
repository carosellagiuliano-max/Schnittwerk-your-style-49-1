import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Types based on the existing mock data structure
export interface Customer {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'child';
  ageGroup: 'adult' | 'child';
  email: string;
  phone: string;
  appointments: number;
  totalRevenue: number;
  status: 'neu' | 'bronze' | 'silber' | 'gold' | 'diamant';
  lastVisit: string;
  nextAppointment: string | null;
  hasAppointmentThisWeek: boolean;
}

export interface CustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(customer: Omit<Customer, 'id' | 'appointments' | 'totalRevenue' | 'status' | 'hasAppointmentThisWeek'>): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  searchCustomers(query: string): Promise<Customer[]>;
}

// Mock customer data (from existing CustomerManagement.tsx)
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Maria Schmidt',
    gender: 'female',
    ageGroup: 'adult',
    email: 'maria.schmidt@email.com',
    phone: '+41 79 123 45 67',
    appointments: 12,
    totalRevenue: 1240,
    status: 'gold',
    lastVisit: '2024-01-10',
    nextAppointment: '2024-01-20',
    hasAppointmentThisWeek: true
  },
  {
    id: '2',
    name: 'Hans Müller',
    gender: 'male',
    ageGroup: 'adult',
    email: 'hans.mueller@email.com',
    phone: '+41 79 234 56 78',
    appointments: 8,
    totalRevenue: 620,
    status: 'silber',
    lastVisit: '2024-01-08',
    nextAppointment: null,
    hasAppointmentThisWeek: false
  },
  {
    id: '3',
    name: 'Sarah Weber',
    gender: 'female',
    ageGroup: 'adult',
    email: 'sarah.weber@email.com',
    phone: '+41 79 345 67 89',
    appointments: 25,
    totalRevenue: 2150,
    status: 'diamant',
    lastVisit: '2024-01-12',
    nextAppointment: '2024-01-25',
    hasAppointmentThisWeek: false
  },
  {
    id: '4',
    name: 'Emma Keller',
    gender: 'child',
    ageGroup: 'child',
    email: 'lisa.keller@email.com',
    phone: '+41 79 456 78 90',
    appointments: 3,
    totalRevenue: 180,
    status: 'neu',
    lastVisit: '2024-01-05',
    nextAppointment: null,
    hasAppointmentThisWeek: false
  },
  {
    id: '5',
    name: 'Thomas Zimmermann',
    gender: 'male',
    ageGroup: 'adult',
    email: 'thomas.zimmermann@email.com',
    phone: '+41 79 567 89 01',
    appointments: 6,
    totalRevenue: 390,
    status: 'bronze',
    lastVisit: '2024-01-09',
    nextAppointment: '2024-01-18',
    hasAppointmentThisWeek: true
  },
  {
    id: '6',
    name: 'Luca Meyer',
    gender: 'child',
    ageGroup: 'child',
    email: 'meyer.family@email.com',
    phone: '+41 79 678 90 12',
    appointments: 4,
    totalRevenue: 120,
    status: 'neu',
    lastVisit: '2024-01-07',
    nextAppointment: null,
    hasAppointmentThisWeek: false
  }
];

// Mock customer service
class MockCustomerService implements CustomerService {
  async getCustomers(): Promise<Customer[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[MOCK] Fetching all customers');
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    return [...mockCustomers];
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Fetching customer by ID: ${id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    return mockCustomers.find(customer => customer.id === id) || null;
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'appointments' | 'totalRevenue' | 'status' | 'hasAppointmentThisWeek'>): Promise<Customer> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[MOCK] Creating new customer');
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const newCustomer: Customer = {
      ...customerData,
      id: (mockCustomers.length + 1).toString(),
      appointments: 0,
      totalRevenue: 0,
      status: 'neu',
      hasAppointmentThisWeek: false
    };
    
    mockCustomers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Updating customer: ${id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    
    mockCustomers[customerIndex] = { ...mockCustomers[customerIndex], ...updates };
    return mockCustomers[customerIndex];
  }

  async deleteCustomer(id: string): Promise<void> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Deleting customer: ${id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    
    mockCustomers.splice(customerIndex, 1);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Searching customers for: ${query}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const searchTerm = query.toLowerCase();
    return mockCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm)
    );
  }
}

// Real customer service using Supabase
class RealCustomerService implements CustomerService {
  async getCustomers(): Promise<Customer[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[REAL] Fetching all customers from Supabase');
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        date_of_birth,
        created_at,
        updated_at,
        auth_users:id (
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
    
    // Transform database data to match interface
    return data.map(customer => {
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      const birthDate = customer.date_of_birth ? new Date(customer.date_of_birth) : null;
      const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;
      
      return {
        id: customer.id,
        name: fullName || 'Unbekannt',
        gender: age && age < 18 ? 'child' : 'female', // Default logic, should be enhanced
        ageGroup: age && age < 18 ? 'child' : 'adult',
        email: customer.auth_users?.email || '',
        phone: customer.phone || '',
        appointments: 0, // TODO: Calculate from appointments table
        totalRevenue: 0, // TODO: Calculate from orders table
        status: 'neu', // TODO: Calculate based on total revenue
        lastVisit: customer.updated_at || customer.created_at,
        nextAppointment: null, // TODO: Get from appointments table
        hasAppointmentThisWeek: false // TODO: Calculate from appointments table
      };
    });
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Fetching customer by ID: ${id}`);
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        date_of_birth,
        created_at,
        updated_at,
        auth_users:id (
          email
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    if (!data) return null;
    
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const birthDate = data.date_of_birth ? new Date(data.date_of_birth) : null;
    const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;
    
    return {
      id: data.id,
      name: fullName || 'Unbekannt',
      gender: age && age < 18 ? 'child' : 'female', // Default logic, should be enhanced
      ageGroup: age && age < 18 ? 'child' : 'adult',
      email: data.auth_users?.email || '',
      phone: data.phone || '',
      appointments: 0, // TODO: Calculate from appointments table
      totalRevenue: 0, // TODO: Calculate from orders table
      status: 'neu', // TODO: Calculate based on total revenue
      lastVisit: data.updated_at || data.created_at,
      nextAppointment: null, // TODO: Get from appointments table
      hasAppointmentThisWeek: false // TODO: Calculate from appointments table
    };
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'appointments' | 'totalRevenue' | 'status' | 'hasAppointmentThisWeek'>): Promise<Customer> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[REAL] Creating new customer');
    }
    
    // For now, this is a simplified implementation
    // In production, this would involve creating an auth user first
    throw new Error('Customer creation not yet implemented for real backend');
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Updating customer: ${id}`);
    }
    
    // Extract fields that map to the database
    const dbUpdates: any = {};
    
    if (updates.name) {
      const [firstName, ...lastNameParts] = updates.name.split(' ');
      dbUpdates.first_name = firstName;
      dbUpdates.last_name = lastNameParts.join(' ');
    }
    
    if (updates.phone) {
      dbUpdates.phone = updates.phone;
    }
    
    const { error } = await supabase
      .from('customers')
      .update(dbUpdates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
    
    // Return updated customer
    const updatedCustomer = await this.getCustomerById(id);
    if (!updatedCustomer) {
      throw new Error('Customer not found after update');
    }
    
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Deleting customer: ${id}`);
    }
    
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Searching customers for: ${query}`);
    }
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        date_of_birth,
        created_at,
        updated_at,
        auth_users:id (
          email
        )
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
    
    return data.map(customer => {
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      const birthDate = customer.date_of_birth ? new Date(customer.date_of_birth) : null;
      const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;
      
      return {
        id: customer.id,
        name: fullName || 'Unbekannt',
        gender: age && age < 18 ? 'child' : 'female', // Default logic, should be enhanced
        ageGroup: age && age < 18 ? 'child' : 'adult',
        email: customer.auth_users?.email || '',
        phone: customer.phone || '',
        appointments: 0, // TODO: Calculate from appointments table
        totalRevenue: 0, // TODO: Calculate from orders table
        status: 'neu', // TODO: Calculate based on total revenue
        lastVisit: customer.updated_at || customer.created_at,
        nextAppointment: null, // TODO: Get from appointments table
        hasAppointmentThisWeek: false // TODO: Calculate from appointments table
      };
    });
  }
}

// Factory function to get the appropriate service
export function createCustomerService(): CustomerService {
  if (FEATURE_FLAGS.USE_REAL_API) {
    return new RealCustomerService();
  }
  return new MockCustomerService();
}

// Export singleton instance
export const customerService = createCustomerService();