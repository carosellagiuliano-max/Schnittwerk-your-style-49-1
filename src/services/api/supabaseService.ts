/**
 * Supabase API Service Implementation
 * Real database integration using Supabase
 * Based on PLAN.md Sprint A requirements
 */

import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import type { 
  APIService, 
  Customer, 
  Product, 
  Category, 
  Service, 
  Appointment 
} from './mockService';

/**
 * Supabase API Service Implementation
 * Provides real database integration using Supabase
 */
export class SupabaseAPIService implements APIService {
  private log(method: string, params?: any): void {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[SupabaseAPI] ${method}`, params);
    }
  }

  private handleError(error: any, operation: string): never {
    console.error(`[SupabaseAPI] ${operation} failed:`, error);
    throw new Error(`${operation} failed: ${error.message || error}`);
  }

  // Customer Management - Supabase Implementation
  async getCustomers(): Promise<Customer[]> {
    this.log('getCustomers');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(this.mapProfileToCustomer);
    } catch (error) {
      this.handleError(error, 'getCustomers');
    }
  }

  async getCustomer(id: string): Promise<Customer | null> {
    this.log('getCustomer', { id });
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'customer')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data ? this.mapProfileToCustomer(data) : null;
    } catch (error) {
      this.handleError(error, 'getCustomer');
    }
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    this.log('createCustomer', customer);
    
    try {
      // Create auth user first if needed
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customer.email!,
        password: Math.random().toString(36).slice(-8), // Temporary password
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const profileData = {
        id: authData.user.id,
        role: 'customer',
        full_name: customer.full_name || '',
        email: customer.email!,
        phone: customer.phone,
        gender: customer.gender,
        date_of_birth: customer.date_of_birth,
        marketing_consent: customer.marketing_consent || false,
        notes: customer.notes,
        gdpr_consent_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      
      return this.mapProfileToCustomer(data);
    } catch (error) {
      this.handleError(error, 'createCustomer');
    }
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    this.log('updateCustomer', { id, customer });
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: customer.full_name,
          phone: customer.phone,
          gender: customer.gender,
          date_of_birth: customer.date_of_birth,
          marketing_consent: customer.marketing_consent,
          notes: customer.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('role', 'customer')
        .select()
        .single();

      if (error) throw error;
      
      return this.mapProfileToCustomer(data);
    } catch (error) {
      this.handleError(error, 'updateCustomer');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    this.log('deleteCustomer', { id });
    
    try {
      // GDPR compliant soft delete - anonymize data
      const { error } = await supabase
        .from('profiles')
        .update({
          email: `deleted-${id}@anonymized.local`,
          phone: null,
          full_name: 'Deleted User',
          notes: null,
          data_retention_until: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .eq('role', 'customer');

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteCustomer');
    }
  }

  // Product Management - Supabase Implementation
  async getProducts(): Promise<Product[]> {
    this.log('getProducts');
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getProducts');
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    this.log('getProduct', { id });
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      this.handleError(error, 'getProduct');
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    this.log('getProductsByCategory', { categoryId });
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getProductsByCategory');
    }
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    this.log('createProduct', product);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          category_id: product.category_id!,
          name: product.name!,
          description: product.description!,
          detailed_description: product.detailed_description,
          usage_instructions: product.usage_instructions,
          price: product.price!,
          currency: 'CHF',
          sku: product.sku,
          stock_quantity: product.stock_quantity || 0,
          image_url: product.image_url,
          is_active: product.is_active !== false,
          sort_order: product.sort_order || 0,
          vat_rate: 7.70,
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'createProduct');
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    this.log('updateProduct', { id, product });
    
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          category_id: product.category_id,
          name: product.name,
          description: product.description,
          detailed_description: product.detailed_description,
          usage_instructions: product.usage_instructions,
          price: product.price,
          sku: product.sku,
          stock_quantity: product.stock_quantity,
          image_url: product.image_url,
          is_active: product.is_active,
          sort_order: product.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'updateProduct');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    this.log('deleteProduct', { id });
    
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteProduct');
    }
  }

  // Category Management - Supabase Implementation
  async getCategories(): Promise<Category[]> {
    this.log('getCategories');
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getCategories');
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    this.log('getCategory', { id });
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      this.handleError(error, 'getCategory');
    }
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    this.log('createCategory', category);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name!,
          description: category.description,
          slug: category.slug || category.name!.toLowerCase().replace(/\s+/g, '-'),
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== false,
          parent_id: category.parent_id,
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'createCategory');
    }
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    this.log('updateCategory', { id, category });
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          description: category.description,
          slug: category.slug,
          sort_order: category.sort_order,
          is_active: category.is_active,
          parent_id: category.parent_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'updateCategory');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    this.log('deleteCategory', { id });
    
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteCategory');
    }
  }

  // Service Management - Supabase Implementation
  async getServices(): Promise<Service[]> {
    this.log('getServices');
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getServices');
    }
  }

  async getService(id: string): Promise<Service | null> {
    this.log('getService', { id });
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      this.handleError(error, 'getService');
    }
  }

  async createService(service: Partial<Service>): Promise<Service> {
    this.log('createService', service);
    
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: service.name!,
          description: service.description!,
          duration_minutes: service.duration_minutes || 60,
          price: service.price!,
          currency: 'CHF',
          requires_gender: service.requires_gender,
          is_active: service.is_active !== false,
          sort_order: service.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'createService');
    }
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    this.log('updateService', { id, service });
    
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price: service.price,
          requires_gender: service.requires_gender,
          is_active: service.is_active,
          sort_order: service.sort_order,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'updateService');
    }
  }

  async deleteService(id: string): Promise<void> {
    this.log('deleteService', { id });
    
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteService');
    }
  }

  // Appointment Management - Supabase Implementation
  async getAppointments(): Promise<Appointment[]> {
    this.log('getAppointments');
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getAppointments');
    }
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    this.log('getAppointment', { id });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data;
    } catch (error) {
      this.handleError(error, 'getAppointment');
    }
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    this.log('getAppointmentsByCustomer', { customerId });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getAppointmentsByCustomer');
    }
  }

  async getAppointmentsByStaff(staffId: string): Promise<Appointment[]> {
    this.log('getAppointmentsByStaff', { staffId });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', staffId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getAppointmentsByStaff');
    }
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    this.log('getAppointmentsByDate', { date });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', date)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getAppointmentsByDate');
    }
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    this.log('createAppointment', appointment);
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          customer_id: appointment.customer_id!,
          staff_id: appointment.staff_id!,
          service_id: appointment.service_id!,
          appointment_date: appointment.appointment_date!,
          start_time: appointment.start_time!,
          end_time: appointment.end_time!,
          duration_minutes: appointment.duration_minutes || 60,
          status: 'pending',
          price: appointment.price!,
          currency: 'CHF',
          notes: appointment.notes,
          internal_notes: appointment.internal_notes,
        })
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'createAppointment');
    }
  }

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    this.log('updateAppointment', { id, appointment });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          staff_id: appointment.staff_id,
          service_id: appointment.service_id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          price: appointment.price,
          notes: appointment.notes,
          internal_notes: appointment.internal_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      this.handleError(error, 'updateAppointment');
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    this.log('deleteAppointment', { id });
    
    try {
      // For appointments, we might want to set status to cancelled instead of hard delete
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled_by_salon',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteAppointment');
    }
  }

  // Helper method to map Supabase profile to Customer interface
  private mapProfileToCustomer(profile: any): Customer {
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      gender: profile.gender,
      date_of_birth: profile.date_of_birth,
      total_spent: profile.total_spent || 0,
      loyalty_status: profile.loyalty_status || 'neu',
      last_visit: profile.last_visit,
      role: 'customer',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      marketing_consent: profile.marketing_consent || false,
      notes: profile.notes,
    };
  }
}