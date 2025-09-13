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
  createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
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
}