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
  Appointment,
  Staff,
  StaffSchedule,
  WaitingListEntry,
  AppointmentConflict,
  TimeSlot
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

  // Sprint B: Advanced Appointment Features Implementation
  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    this.log('getAppointmentsByDateRange', { startDate, endDate });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getAppointmentsByDateRange');
    }
  }

  async checkAppointmentConflicts(appointment: Partial<Appointment>): Promise<AppointmentConflict[]> {
    this.log('checkAppointmentConflicts', appointment);
    
    const conflicts: AppointmentConflict[] = [];
    
    if (!appointment.staff_id || !appointment.appointment_date || !appointment.start_time) {
      return conflicts;
    }
    
    try {
      // Check for staff double booking
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', appointment.staff_id)
        .eq('appointment_date', appointment.appointment_date)
        .eq('start_time', appointment.start_time)
        .neq('id', appointment.id || '');

      if (error) throw error;
      
      if (data && data.length > 0) {
        conflicts.push({
          type: 'staff_double_booking',
          message: 'Staff member already has an appointment at this time',
          conflicting_appointment_id: data[0].id
        });
      }
      
      return conflicts;
    } catch (error) {
      this.handleError(error, 'checkAppointmentConflicts');
    }
  }

  async getAvailableTimeSlots(date: string, serviceId: string, staffId?: string): Promise<TimeSlot[]> {
    this.log('getAvailableTimeSlots', { date, serviceId, staffId });
    
    try {
      // Get staff schedules for the date
      const dayOfWeek = new Date(date).getDay();
      let staffQuery = supabase
        .from('staff')
        .select(`
          id,
          full_name,
          staff_schedules!inner(*)
        `)
        .eq('is_active', true)
        .eq('staff_schedules.day_of_week', dayOfWeek)
        .eq('staff_schedules.is_available', true);

      if (staffId) {
        staffQuery = staffQuery.eq('id', staffId);
      }

      const { data: staffData, error: staffError } = await staffQuery;
      if (staffError) throw staffError;

      // Get existing appointments for the date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', date);

      if (appointmentsError) throw appointmentsError;

      const timeSlots: TimeSlot[] = [];
      const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

      for (const staff of staffData || []) {
        for (const time of times) {
          const isBooked = appointments?.some(apt => 
            apt.staff_id === staff.id && apt.start_time === time
          );

          if (!isBooked) {
            timeSlots.push({
              date,
              start_time: time,
              end_time: this.addMinutes(time, 60),
              staff_id: staff.id,
              staff_name: staff.full_name,
              duration_minutes: 60,
              is_available: true
            });
          }
        }
      }

      return timeSlots;
    } catch (error) {
      this.handleError(error, 'getAvailableTimeSlots');
    }
  }

  async rescheduleAppointment(appointmentId: string, newDate: string, newStartTime: string): Promise<Appointment> {
    this.log('rescheduleAppointment', { appointmentId, newDate, newStartTime });
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          start_time: newStartTime,
          end_time: this.addMinutes(newStartTime, 60), // Assuming 60 min duration
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'rescheduleAppointment');
    }
  }

  // Sprint B: Staff Management Implementation
  async getStaff(): Promise<Staff[]> {
    this.log('getStaff');
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles!inner(full_name, email, phone)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(this.mapStaffFromSupabase);
    } catch (error) {
      this.handleError(error, 'getStaff');
    }
  }

  async getStaffMember(id: string): Promise<Staff | null> {
    this.log('getStaffMember', { id });
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles!inner(full_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return this.mapStaffFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'getStaffMember');
    }
  }

  async createStaffMember(staff: Partial<Staff>): Promise<Staff> {
    this.log('createStaffMember', staff);
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert({
          employee_id: staff.employee_id || `EMP${Date.now()}`,
          position: staff.position || 'stylist',
          specialties: staff.specialties || [],
          weekly_hours: staff.weekly_hours || 40,
          hourly_rate: staff.hourly_rate,
          commission_rate: staff.commission_rate,
          is_active: true,
          hire_date: staff.hire_date || new Date().toISOString().split('T')[0]
        })
        .select(`
          *,
          profiles!inner(full_name, email, phone)
        `)
        .single();

      if (error) throw error;
      return this.mapStaffFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'createStaffMember');
    }
  }

  async updateStaffMember(id: string, staff: Partial<Staff>): Promise<Staff> {
    this.log('updateStaffMember', { id, staff });
    
    try {
      const { data, error } = await supabase
        .from('staff')
        .update({
          ...staff,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          profiles!inner(full_name, email, phone)
        `)
        .single();

      if (error) throw error;
      return this.mapStaffFromSupabase(data);
    } catch (error) {
      this.handleError(error, 'updateStaffMember');
    }
  }

  async deleteStaffMember(id: string): Promise<void> {
    this.log('deleteStaffMember', { id });
    
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteStaffMember');
    }
  }

  // Sprint B: Staff Scheduling Implementation
  async getStaffSchedules(staffId?: string): Promise<StaffSchedule[]> {
    this.log('getStaffSchedules', { staffId });
    
    try {
      let query = supabase
        .from('staff_schedules')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      this.handleError(error, 'getStaffSchedules');
    }
  }

  async getStaffSchedule(staffId: string, date: string): Promise<StaffSchedule[]> {
    this.log('getStaffSchedule', { staffId, date });
    
    try {
      const dayOfWeek = new Date(date).getDay();
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .eq('day_of_week', dayOfWeek)
        .lte('effective_date', date)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getStaffSchedule');
    }
  }

  async createStaffSchedule(schedule: Partial<StaffSchedule>): Promise<StaffSchedule> {
    this.log('createStaffSchedule', schedule);
    
    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .insert({
          staff_id: schedule.staff_id || '',
          effective_date: schedule.effective_date || new Date().toISOString().split('T')[0],
          day_of_week: schedule.day_of_week || 1,
          start_time: schedule.start_time || '09:00',
          end_time: schedule.end_time || '17:00',
          break_start: schedule.break_start,
          break_end: schedule.break_end,
          is_regular: schedule.is_regular ?? true,
          is_available: schedule.is_available ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'createStaffSchedule');
    }
  }

  async updateStaffSchedule(id: string, schedule: Partial<StaffSchedule>): Promise<StaffSchedule> {
    this.log('updateStaffSchedule', { id, schedule });
    
    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .update(schedule)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateStaffSchedule');
    }
  }

  async deleteStaffSchedule(id: string): Promise<void> {
    this.log('deleteStaffSchedule', { id });
    
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'deleteStaffSchedule');
    }
  }

  // Sprint B: Waiting List Implementation
  async getWaitingList(): Promise<WaitingListEntry[]> {
    this.log('getWaitingList');
    
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getWaitingList');
    }
  }

  async getWaitingListEntry(id: string): Promise<WaitingListEntry | null> {
    this.log('getWaitingListEntry', { id });
    
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return data;
    } catch (error) {
      this.handleError(error, 'getWaitingListEntry');
    }
  }

  async addToWaitingList(entry: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    this.log('addToWaitingList', entry);
    
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .insert({
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
          notify_sms: entry.notify_sms ?? false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'addToWaitingList');
    }
  }

  async updateWaitingListEntry(id: string, entry: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    this.log('updateWaitingListEntry', { id, entry });
    
    try {
      const { data, error } = await supabase
        .from('waiting_list')
        .update(entry)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateWaitingListEntry');
    }
  }

  async removeFromWaitingList(id: string): Promise<void> {
    this.log('removeFromWaitingList', { id });
    
    try {
      const { error } = await supabase
        .from('waiting_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.handleError(error, 'removeFromWaitingList');
    }
  }

  async convertWaitingListToAppointment(entryId: string, timeSlot: TimeSlot): Promise<Appointment> {
    this.log('convertWaitingListToAppointment', { entryId, timeSlot });
    
    try {
      const entry = await this.getWaitingListEntry(entryId);
      if (!entry) throw new Error('Waiting list entry not found');

      // Create appointment
      const appointment = await this.createAppointment({
        customer_id: entry.customer_id,
        staff_id: timeSlot.staff_id,
        service_id: entry.service_id,
        appointment_date: timeSlot.date,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        duration_minutes: timeSlot.duration_minutes,
        status: 'confirmed',
        price: 80, // Mock price - should come from service
        currency: 'CHF',
        notes: 'Converted from waiting list'
      });

      // Remove from waiting list
      await this.removeFromWaitingList(entryId);

      return appointment;
    } catch (error) {
      this.handleError(error, 'convertWaitingListToAppointment');
    }
  }

  // Helper methods
  private mapStaffFromSupabase(data: any): Staff {
    return {
      id: data.id,
      profile_id: data.profile_id,
      employee_id: data.employee_id,
      position: data.position,
      full_name: data.profiles?.full_name || '',
      email: data.profiles?.email || '',
      phone: data.profiles?.phone,
      specialties: data.specialties || [],
      weekly_hours: data.weekly_hours,
      hourly_rate: data.hourly_rate,
      commission_rate: data.commission_rate,
      is_active: data.is_active,
      hire_date: data.hire_date,
      termination_date: data.termination_date,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
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