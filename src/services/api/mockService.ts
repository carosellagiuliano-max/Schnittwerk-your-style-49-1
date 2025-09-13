/**
 * API Service Layer - Feature Flag Implementation
 * Based on PLAN.md Sprint A requirements
 * 
 * Implements service abstraction pattern allowing seamless switching
 * between mock data and real Supabase API calls using feature flags.
 */

import { FEATURE_FLAGS } from '@/config/featureFlags';

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  gender?: 'female' | 'male' | 'child' | 'other';
  date_of_birth?: string;
  total_spent: number;
  loyalty_status: 'neu' | 'bronze' | 'silber' | 'gold' | 'diamant';
  last_visit?: string;
  role: 'customer';
  created_at: string;
  updated_at: string;
  marketing_consent: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  detailed_description?: string;
  usage_instructions?: string;
  price: number;
  currency: string;
  sku?: string;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  vat_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  parent_id?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
  requires_gender?: 'female' | 'male' | 'child' | 'other';
  is_active: boolean;
  sort_order: number;
}

export interface Appointment {
  id: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_salon' | 'no_show';
  price: number;
  currency: string;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

// Sprint B: Staff Management Interface
export interface Staff {
  id: string;
  profile_id?: string;
  employee_id: string;
  position: 'owner' | 'senior_stylist' | 'stylist' | 'assistant' | 'trainee';
  full_name: string;
  email: string;
  phone?: string;
  specialties: string[]; // ['schnitt', 'farbe', 'bart']
  weekly_hours: number;
  hourly_rate?: number;
  commission_rate?: number;
  is_active: boolean;
  hire_date: string;
  termination_date?: string;
  created_at: string;
  updated_at: string;
}

// Sprint B: Staff Schedule Interface
export interface StaffSchedule {
  id: string;
  staff_id: string;
  effective_date: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_regular: boolean; // vs. one-time override
  is_available: boolean;
  created_at: string;
}

// Sprint B: Waiting List Interface
export interface WaitingListEntry {
  id: string;
  customer_id: string;
  service_id: string;
  preferred_staff_id?: string;
  preferred_date?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  flexible_dates: boolean;
  flexible_times: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  max_wait_days: number;
  notify_email: boolean;
  notify_sms: boolean;
  last_notified_at?: string;
  created_at: string;
}

// Sprint B: Appointment Conflict Detection
export interface AppointmentConflict {
  type: 'staff_double_booking' | 'customer_double_booking' | 'outside_hours' | 'break_time';
  message: string;
  conflicting_appointment_id?: string;
  suggested_times?: string[];
}

// Sprint B: Available Time Slot
export interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  staff_id: string;
  staff_name: string;
  duration_minutes: number;
  is_available: boolean;
}

/**
 * Abstract API Service Interface
 * Defines the contract that both Mock and Real implementations must follow
 */
export interface APIService {
  // Customer Management
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(customer: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Product Management
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  createProduct(product: Partial<Product>): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Category Management
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(category: Partial<Category>): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Service Management
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(service: Partial<Service>): Promise<Service>;
  updateService(id: string, service: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Appointment Management
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  getAppointmentsByStaff(staffId: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  
  // Sprint B: Advanced Appointment Features
  checkAppointmentConflicts(appointment: Partial<Appointment>): Promise<AppointmentConflict[]>;
  getAvailableTimeSlots(date: string, serviceId: string, staffId?: string): Promise<TimeSlot[]>;
  rescheduleAppointment(appointmentId: string, newDate: string, newStartTime: string): Promise<Appointment>;
  
  // Sprint B: Staff Management
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | null>;
  createStaffMember(staff: Partial<Staff>): Promise<Staff>;
  updateStaffMember(id: string, staff: Partial<Staff>): Promise<Staff>;
  deleteStaffMember(id: string): Promise<void>;
  
  // Sprint B: Staff Scheduling
  getStaffSchedules(staffId?: string): Promise<StaffSchedule[]>;
  getStaffSchedule(staffId: string, date: string): Promise<StaffSchedule[]>;
  createStaffSchedule(schedule: Partial<StaffSchedule>): Promise<StaffSchedule>;
  updateStaffSchedule(id: string, schedule: Partial<StaffSchedule>): Promise<StaffSchedule>;
  deleteStaffSchedule(id: string): Promise<void>;
  
  // Sprint B: Waiting List Management
  getWaitingList(): Promise<WaitingListEntry[]>;
  getWaitingListEntry(id: string): Promise<WaitingListEntry | null>;
  addToWaitingList(entry: Partial<WaitingListEntry>): Promise<WaitingListEntry>;
  updateWaitingListEntry(id: string, entry: Partial<WaitingListEntry>): Promise<WaitingListEntry>;
  removeFromWaitingList(id: string): Promise<void>;
  convertWaitingListToAppointment(entryId: string, timeSlot: TimeSlot): Promise<Appointment>;
}

/**
 * Mock API Service Implementation
 * Provides mock data for development and testing
 */
export class MockAPIService implements APIService {
  private delay(): Promise<void> {
    return new Promise(resolve => 
      setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY)
    );
  }

  private log(method: string, params?: any): void {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MockAPI] ${method}`, params);
    }
  }

  // Customer Management - Mock Implementation
  async getCustomers(): Promise<Customer[]> {
    this.log('getCustomers');
    await this.delay();
    
    // Return mock customers similar to existing mockCustomers
    return [
      {
        id: '1',
        full_name: 'Maria Schmidt',
        email: 'maria.schmidt@email.com',
        phone: '+41 79 123 45 67',
        gender: 'female',
        total_spent: 1240,
        loyalty_status: 'gold',
        last_visit: '2024-01-10',
        role: 'customer',
        created_at: '2023-06-15T10:00:00Z',
        updated_at: '2024-01-10T14:30:00Z',
        marketing_consent: true,
        notes: 'Bevorzugt Termine am Nachmittag'
      },
      {
        id: '2',
        full_name: 'Hans Müller',
        email: 'hans.mueller@email.com',
        phone: '+41 79 234 56 78',
        gender: 'male',
        total_spent: 620,
        loyalty_status: 'silber',
        last_visit: '2024-01-08',
        role: 'customer',
        created_at: '2023-08-20T09:15:00Z',
        updated_at: '2024-01-08T11:45:00Z',
        marketing_consent: false
      }
    ];
  }

  async getCustomer(id: string): Promise<Customer | null> {
    this.log('getCustomer', { id });
    await this.delay();
    
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id) || null;
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    this.log('createCustomer', customer);
    await this.delay();
    
    const newCustomer: Customer = {
      id: `customer_${Date.now()}`,
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone,
      gender: customer.gender,
      date_of_birth: customer.date_of_birth,
      total_spent: 0,
      loyalty_status: 'neu',
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      marketing_consent: customer.marketing_consent || false,
      notes: customer.notes
    };
    
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    this.log('updateCustomer', { id, customer });
    await this.delay();
    
    const existing = await this.getCustomer(id);
    if (!existing) throw new Error('Customer not found');
    
    return {
      ...existing,
      ...customer,
      updated_at: new Date().toISOString()
    };
  }

  async deleteCustomer(id: string): Promise<void> {
    this.log('deleteCustomer', { id });
    await this.delay();
    // Mock deletion - in real implementation this would be a soft delete for GDPR compliance
  }

  // Product Management - Mock Implementation
  async getProducts(): Promise<Product[]> {
    this.log('getProducts');
    await this.delay();
    
    return [
      {
        id: 'prod_1',
        category_id: 'cat_shampoo',
        name: 'Hydrating Shampoo',
        description: 'Feuchtigkeitsspendendes Shampoo für trockenes Haar',
        detailed_description: 'Unser Hydrating Shampoo wurde speziell für trockenes und strapaziertes Haar entwickelt.',
        usage_instructions: 'Auf das nasse Haar auftragen, sanft einmassieren und gründlich ausspülen.',
        price: 24.90,
        currency: 'CHF',
        sku: 'TRI-SHAMP-HYD',
        stock_quantity: 15,
        image_url: '/assets/products/hydrating-shampoo.jpg',
        is_active: true,
        sort_order: 1,
        vat_rate: 7.70,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }

  async getProduct(id: string): Promise<Product | null> {
    this.log('getProduct', { id });
    await this.delay();
    
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    this.log('getProductsByCategory', { categoryId });
    await this.delay();
    
    const products = await this.getProducts();
    return products.filter(p => p.category_id === categoryId);
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    this.log('createProduct', product);
    await this.delay();
    
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      category_id: product.category_id || '',
      name: product.name || '',
      description: product.description || '',
      detailed_description: product.detailed_description,
      usage_instructions: product.usage_instructions,
      price: product.price || 0,
      currency: 'CHF',
      sku: product.sku,
      stock_quantity: product.stock_quantity || 0,
      image_url: product.image_url,
      is_active: product.is_active !== false,
      sort_order: product.sort_order || 0,
      vat_rate: 7.70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    this.log('updateProduct', { id, product });
    await this.delay();
    
    const existing = await this.getProduct(id);
    if (!existing) throw new Error('Product not found');
    
    return {
      ...existing,
      ...product,
      updated_at: new Date().toISOString()
    };
  }

  async deleteProduct(id: string): Promise<void> {
    this.log('deleteProduct', { id });
    await this.delay();
  }

  // Category Management - Mock Implementation
  async getCategories(): Promise<Category[]> {
    this.log('getCategories');
    await this.delay();
    
    return [
      {
        id: 'cat_shampoo',
        name: 'Trinity Haircare Shampoo',
        description: 'Hochwertige Shampoos für verschiedene Haartypen',
        slug: 'trinity-shampoo',
        sort_order: 1,
        is_active: true
      },
      {
        id: 'cat_conditioner',
        name: 'Trinity Haircare Conditioner',
        description: 'Pflegende Conditioner für gesundes Haar',
        slug: 'trinity-conditioner',
        sort_order: 2,
        is_active: true
      }
    ];
  }

  async getCategory(id: string): Promise<Category | null> {
    this.log('getCategory', { id });
    await this.delay();
    
    const categories = await this.getCategories();
    return categories.find(c => c.id === id) || null;
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    this.log('createCategory', category);
    await this.delay();
    
    const newCategory: Category = {
      id: `category_${Date.now()}`,
      name: category.name || '',
      description: category.description,
      slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== false,
      parent_id: category.parent_id
    };
    
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    this.log('updateCategory', { id, category });
    await this.delay();
    
    const existing = await this.getCategory(id);
    if (!existing) throw new Error('Category not found');
    
    return {
      ...existing,
      ...category
    };
  }

  async deleteCategory(id: string): Promise<void> {
    this.log('deleteCategory', { id });
    await this.delay();
  }

  // Service Management - Mock Implementation
  async getServices(): Promise<Service[]> {
    this.log('getServices');
    await this.delay();
    
    return [
      {
        id: 'service_1',
        name: 'Damenschnitt',
        description: 'Professioneller Haarschnitt für Damen',
        duration_minutes: 60,
        price: 75.00,
        currency: 'CHF',
        requires_gender: 'female',
        is_active: true,
        sort_order: 1
      },
      {
        id: 'service_2',
        name: 'Herrenschnitt',
        description: 'Klassischer Herrenhaarschnitt',
        duration_minutes: 45,
        price: 45.00,
        currency: 'CHF',
        requires_gender: 'male',
        is_active: true,
        sort_order: 2
      }
    ];
  }

  async getService(id: string): Promise<Service | null> {
    this.log('getService', { id });
    await this.delay();
    
    const services = await this.getServices();
    return services.find(s => s.id === id) || null;
  }

  async createService(service: Partial<Service>): Promise<Service> {
    this.log('createService', service);
    await this.delay();
    
    const newService: Service = {
      id: `service_${Date.now()}`,
      name: service.name || '',
      description: service.description || '',
      duration_minutes: service.duration_minutes || 60,
      price: service.price || 0,
      currency: 'CHF',
      requires_gender: service.requires_gender,
      is_active: service.is_active !== false,
      sort_order: service.sort_order || 0
    };
    
    return newService;
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    this.log('updateService', { id, service });
    await this.delay();
    
    const existing = await this.getService(id);
    if (!existing) throw new Error('Service not found');
    
    return {
      ...existing,
      ...service
    };
  }

  async deleteService(id: string): Promise<void> {
    this.log('deleteService', { id });
    await this.delay();
  }

  // Appointment Management - Mock Implementation
  async getAppointments(): Promise<Appointment[]> {
    this.log('getAppointments');
    await this.delay();
    
    return [
      {
        id: 'appt_1',
        customer_id: '1',
        staff_id: 'staff_1',
        service_id: 'service_1',
        appointment_date: '2024-01-25',
        start_time: '14:00',
        end_time: '15:00',
        duration_minutes: 60,
        status: 'confirmed',
        price: 75.00,
        currency: 'CHF',
        notes: 'Kundenwunsch: Etwas kürzer schneiden',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      }
    ];
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    this.log('getAppointment', { id });
    await this.delay();
    
    const appointments = await this.getAppointments();
    return appointments.find(a => a.id === id) || null;
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    this.log('getAppointmentsByCustomer', { customerId });
    await this.delay();
    
    const appointments = await this.getAppointments();
    return appointments.filter(a => a.customer_id === customerId);
  }

  async getAppointmentsByStaff(staffId: string): Promise<Appointment[]> {
    this.log('getAppointmentsByStaff', { staffId });
    await this.delay();
    
    const appointments = await this.getAppointments();
    return appointments.filter(a => a.staff_id === staffId);
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    this.log('getAppointmentsByDate', { date });
    await this.delay();
    
    const appointments = await this.getAppointments();
    return appointments.filter(a => a.appointment_date === date);
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    this.log('createAppointment', appointment);
    await this.delay();
    
    const newAppointment: Appointment = {
      id: `appointment_${Date.now()}`,
      customer_id: appointment.customer_id || '',
      staff_id: appointment.staff_id || '',
      service_id: appointment.service_id || '',
      appointment_date: appointment.appointment_date || '',
      start_time: appointment.start_time || '',
      end_time: appointment.end_time || '',
      duration_minutes: appointment.duration_minutes || 60,
      status: 'pending',
      price: appointment.price || 0,
      currency: 'CHF',
      notes: appointment.notes,
      internal_notes: appointment.internal_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    this.log('updateAppointment', { id, appointment });
    await this.delay();
    
    const existing = await this.getAppointment(id);
    if (!existing) throw new Error('Appointment not found');
    
    return {
      ...existing,
      ...appointment,
      updated_at: new Date().toISOString()
    };
  }

  async deleteAppointment(id: string): Promise<void> {
    this.log('deleteAppointment', { id });
    await this.delay();
  }

  // Sprint B: Advanced Appointment Features Implementation
  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    this.log('getAppointmentsByDateRange', { startDate, endDate });
    await this.delay();
    
    const appointments = await this.getAppointments();
    return appointments.filter(a => 
      a.appointment_date >= startDate && a.appointment_date <= endDate
    );
  }

  async checkAppointmentConflicts(appointment: Partial<Appointment>): Promise<AppointmentConflict[]> {
    this.log('checkAppointmentConflicts', appointment);
    await this.delay();
    
    const conflicts: AppointmentConflict[] = [];
    
    if (!appointment.staff_id || !appointment.appointment_date || !appointment.start_time) {
      return conflicts;
    }
    
    // Check for staff double booking
    const existingAppointments = await this.getAppointmentsByStaff(appointment.staff_id);
    const conflictingAppt = existingAppointments.find(a => 
      a.appointment_date === appointment.appointment_date &&
      a.start_time === appointment.start_time &&
      a.id !== appointment.id
    );
    
    if (conflictingAppt) {
      conflicts.push({
        type: 'staff_double_booking',
        message: 'Staff member already has an appointment at this time',
        conflicting_appointment_id: conflictingAppt.id,
        suggested_times: ['10:00', '11:30', '14:00', '15:30']
      });
    }
    
    return conflicts;
  }

  async getAvailableTimeSlots(date: string, serviceId: string, staffId?: string): Promise<TimeSlot[]> {
    this.log('getAvailableTimeSlots', { date, serviceId, staffId });
    await this.delay();
    
    const staff = await this.getStaff();
    const targetStaff = staffId ? staff.filter(s => s.id === staffId) : staff;
    
    const timeSlots: TimeSlot[] = [];
    const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    
    for (const staffMember of targetStaff) {
      for (const time of times) {
        timeSlots.push({
          date,
          start_time: time,
          end_time: this.addMinutes(time, 60),
          staff_id: staffMember.id,
          staff_name: staffMember.full_name,
          duration_minutes: 60,
          is_available: Math.random() > 0.3 // 70% availability
        });
      }
    }
    
    return timeSlots.filter(slot => slot.is_available);
  }

  async rescheduleAppointment(appointmentId: string, newDate: string, newStartTime: string): Promise<Appointment> {
    this.log('rescheduleAppointment', { appointmentId, newDate, newStartTime });
    await this.delay();
    
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    
    return {
      ...appointment,
      appointment_date: newDate,
      start_time: newStartTime,
      end_time: this.addMinutes(newStartTime, appointment.duration_minutes),
      updated_at: new Date().toISOString()
    };
  }

  // Sprint B: Staff Management Implementation
  async getStaff(): Promise<Staff[]> {
    this.log('getStaff');
    await this.delay();
    
    return [
      {
        id: 'staff_1',
        employee_id: 'EMP001',
        position: 'owner',
        full_name: 'Vanessa Müller',
        email: 'vanessa@schnittwerk.ch',
        phone: '+41 79 123 45 67',
        specialties: ['schnitt', 'farbe', 'styling'],
        weekly_hours: 40,
        hourly_rate: 85,
        commission_rate: 15,
        is_active: true,
        hire_date: '2020-01-15',
        created_at: '2020-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z'
      },
      {
        id: 'staff_2',
        employee_id: 'EMP002',
        position: 'senior_stylist',
        full_name: 'Marco Rossi',
        email: 'marco@schnittwerk.ch',
        phone: '+41 79 234 56 78',
        specialties: ['schnitt', 'bart', 'männer'],
        weekly_hours: 35,
        hourly_rate: 65,
        commission_rate: 12,
        is_active: true,
        hire_date: '2021-03-20',
        created_at: '2021-03-20T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'staff_3',
        employee_id: 'EMP003',
        position: 'stylist',
        full_name: 'Sarah Weber',
        email: 'sarah@schnittwerk.ch',
        phone: '+41 79 345 67 89',
        specialties: ['schnitt', 'farbe'],
        weekly_hours: 30,
        hourly_rate: 55,
        commission_rate: 10,
        is_active: true,
        hire_date: '2022-09-10',
        created_at: '2022-09-10T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      }
    ];
  }

  async getStaffMember(id: string): Promise<Staff | null> {
    this.log('getStaffMember', { id });
    await this.delay();
    
    const staff = await this.getStaff();
    return staff.find(s => s.id === id) || null;
  }

  async createStaffMember(staff: Partial<Staff>): Promise<Staff> {
    this.log('createStaffMember', staff);
    await this.delay();
    
    const newStaff: Staff = {
      id: `staff_${Date.now()}`,
      employee_id: staff.employee_id || `EMP${Date.now()}`,
      position: staff.position || 'stylist',
      full_name: staff.full_name || '',
      email: staff.email || '',
      phone: staff.phone,
      specialties: staff.specialties || [],
      weekly_hours: staff.weekly_hours || 40,
      hourly_rate: staff.hourly_rate,
      commission_rate: staff.commission_rate,
      is_active: true,
      hire_date: staff.hire_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return newStaff;
  }

  async updateStaffMember(id: string, staff: Partial<Staff>): Promise<Staff> {
    this.log('updateStaffMember', { id, staff });
    await this.delay();
    
    const existing = await this.getStaffMember(id);
    if (!existing) throw new Error('Staff member not found');
    
    return {
      ...existing,
      ...staff,
      updated_at: new Date().toISOString()
    };
  }

  async deleteStaffMember(id: string): Promise<void> {
    this.log('deleteStaffMember', { id });
    await this.delay();
  }

  // Sprint B: Staff Scheduling Implementation
  async getStaffSchedules(staffId?: string): Promise<StaffSchedule[]> {
    this.log('getStaffSchedules', { staffId });
    await this.delay();
    
    const schedules: StaffSchedule[] = [
      // Vanessa's Schedule
      {
        id: 'schedule_1',
        staff_id: 'staff_1',
        effective_date: '2024-01-01',
        day_of_week: 1, // Monday
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        is_regular: true,
        is_available: true,
        created_at: '2024-01-01T08:00:00Z'
      },
      {
        id: 'schedule_2',
        staff_id: 'staff_1',
        effective_date: '2024-01-01',
        day_of_week: 2, // Tuesday
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        is_regular: true,
        is_available: true,
        created_at: '2024-01-01T08:00:00Z'
      },
      // Marco's Schedule
      {
        id: 'schedule_3',
        staff_id: 'staff_2',
        effective_date: '2024-01-01',
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '18:00',
        break_start: '13:00',
        break_end: '14:00',
        is_regular: true,
        is_available: true,
        created_at: '2024-01-01T09:00:00Z'
      }
    ];
    
    return staffId ? schedules.filter(s => s.staff_id === staffId) : schedules;
  }

  async getStaffSchedule(staffId: string, date: string): Promise<StaffSchedule[]> {
    this.log('getStaffSchedule', { staffId, date });
    await this.delay();
    
    const dayOfWeek = new Date(date).getDay();
    const schedules = await this.getStaffSchedules(staffId);
    return schedules.filter(s => s.day_of_week === dayOfWeek);
  }

  async createStaffSchedule(schedule: Partial<StaffSchedule>): Promise<StaffSchedule> {
    this.log('createStaffSchedule', schedule);
    await this.delay();
    
    const newSchedule: StaffSchedule = {
      id: `schedule_${Date.now()}`,
      staff_id: schedule.staff_id || '',
      effective_date: schedule.effective_date || new Date().toISOString().split('T')[0],
      day_of_week: schedule.day_of_week || 1,
      start_time: schedule.start_time || '09:00',
      end_time: schedule.end_time || '17:00',
      break_start: schedule.break_start,
      break_end: schedule.break_end,
      is_regular: schedule.is_regular ?? true,
      is_available: schedule.is_available ?? true,
      created_at: new Date().toISOString()
    };
    
    return newSchedule;
  }

  async updateStaffSchedule(id: string, schedule: Partial<StaffSchedule>): Promise<StaffSchedule> {
    this.log('updateStaffSchedule', { id, schedule });
    await this.delay();
    
    const existing = await this.getStaffSchedules();
    const found = existing.find(s => s.id === id);
    if (!found) throw new Error('Schedule not found');
    
    return {
      ...found,
      ...schedule
    };
  }

  async deleteStaffSchedule(id: string): Promise<void> {
    this.log('deleteStaffSchedule', { id });
    await this.delay();
  }

  // Sprint B: Waiting List Implementation
  async getWaitingList(): Promise<WaitingListEntry[]> {
    this.log('getWaitingList');
    await this.delay();
    
    return [
      {
        id: 'waiting_1',
        customer_id: '1',
        service_id: 'service_1',
        preferred_staff_id: 'staff_1',
        preferred_date: '2024-01-20',
        preferred_time_start: '10:00',
        preferred_time_end: '12:00',
        flexible_dates: true,
        flexible_times: false,
        priority: 'medium',
        max_wait_days: 14,
        notify_email: true,
        notify_sms: false,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'waiting_2',
        customer_id: '2',
        service_id: 'service_2',
        preferred_date: '2024-01-18',
        flexible_dates: false,
        flexible_times: true,
        priority: 'high',
        max_wait_days: 7,
        notify_email: true,
        notify_sms: true,
        created_at: '2024-01-14T14:30:00Z'
      }
    ];
  }

  async getWaitingListEntry(id: string): Promise<WaitingListEntry | null> {
    this.log('getWaitingListEntry', { id });
    await this.delay();
    
    const waitingList = await this.getWaitingList();
    return waitingList.find(w => w.id === id) || null;
  }

  async addToWaitingList(entry: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    this.log('addToWaitingList', entry);
    await this.delay();
    
    const newEntry: WaitingListEntry = {
      id: `waiting_${Date.now()}`,
      customer_id: entry.customer_id || '',
      service_id: entry.service_id || '',
      preferred_staff_id: entry.preferred_staff_id,
      preferred_date: entry.preferred_date,
      preferred_time_start: entry.preferred_time_start,
      preferred_time_end: entry.preferred_time_end,
      flexible_dates: entry.flexible_dates ?? true,
      flexible_times: entry.flexible_times ?? true,
      priority: entry.priority || 'medium',
      max_wait_days: entry.max_wait_days || 30,
      notify_email: entry.notify_email ?? true,
      notify_sms: entry.notify_sms ?? false,
      created_at: new Date().toISOString()
    };
    
    return newEntry;
  }

  async updateWaitingListEntry(id: string, entry: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    this.log('updateWaitingListEntry', { id, entry });
    await this.delay();
    
    const existing = await this.getWaitingListEntry(id);
    if (!existing) throw new Error('Waiting list entry not found');
    
    return {
      ...existing,
      ...entry
    };
  }

  async removeFromWaitingList(id: string): Promise<void> {
    this.log('removeFromWaitingList', { id });
    await this.delay();
  }

  async convertWaitingListToAppointment(entryId: string, timeSlot: TimeSlot): Promise<Appointment> {
    this.log('convertWaitingListToAppointment', { entryId, timeSlot });
    await this.delay();
    
    const entry = await this.getWaitingListEntry(entryId);
    if (!entry) throw new Error('Waiting list entry not found');
    
    const appointment: Appointment = {
      id: `appointment_${Date.now()}`,
      customer_id: entry.customer_id,
      staff_id: timeSlot.staff_id,
      service_id: entry.service_id,
      appointment_date: timeSlot.date,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      duration_minutes: timeSlot.duration_minutes,
      status: 'confirmed',
      price: 80, // Mock price
      currency: 'CHF',
      notes: 'Converted from waiting list',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return appointment;
  }

  // Helper method for time calculations
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
}