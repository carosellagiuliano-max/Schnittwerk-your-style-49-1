import { supabase } from '@/config/api';

export interface Appointment {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_type: string;
  haircut_details?: any;
  additional_services?: any[];
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  staff_id: string;
  staff_name: string;
  base_price: number;
  additional_cost: number;
  total_price: number;
  deposit_amount?: number;
  payment_status: 'pending' | 'deposit_paid' | 'paid' | 'refunded';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentSummary {
  id: string;
  customer_name?: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  staff_name: string;
  total_price: number;
  status: Appointment['status'];
  payment_status: Appointment['payment_status'];
}

export class AppointmentService {
  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw new Error('Failed to create appointment');
      }

      return data as Appointment;
    } catch (error) {
      console.error('Appointment creation error:', error);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  static async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Appointment not found
        }
        console.error('Error fetching appointment:', error);
        throw new Error('Failed to fetch appointment');
      }

      return data as Appointment;
    } catch (error) {
      console.error('Appointment fetch error:', error);
      throw error;
    }
  }

  /**
   * Get appointments by customer ID
   */
  static async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching customer appointments:', error);
        throw new Error('Failed to fetch customer appointments');
      }

      return data as Appointment[];
    } catch (error) {
      console.error('Customer appointments fetch error:', error);
      throw error;
    }
  }

  /**
   * Get appointments by date range
   */
  static async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments by date range:', error);
        throw new Error('Failed to fetch appointments by date range');
      }

      return data as Appointment[];
    } catch (error) {
      console.error('Date range appointments fetch error:', error);
      throw error;
    }
  }

  /**
   * Get appointments by staff ID
   */
  static async getAppointmentsByStaff(staffId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('staff_id', staffId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching staff appointments:', error);
        throw new Error('Failed to fetch staff appointments');
      }

      return data as Appointment[];
    } catch (error) {
      console.error('Staff appointments fetch error:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment status:', error);
        throw new Error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Appointment status update error:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(appointmentId: string, paymentStatus: Appointment['payment_status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Payment status update error:', error);
      throw error;
    }
  }

  /**
   * Check for appointment conflicts
   */
  static async checkAppointmentConflict(
    staffId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      // Calculate end time
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, duration_minutes')
        .eq('staff_id', staffId)
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (error) {
        console.error('Error checking appointment conflicts:', error);
        throw new Error('Failed to check appointment conflicts');
      }

      // Check for time conflicts
      for (const appointment of data) {
        const existingStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
        const existingEnd = new Date(existingStart.getTime() + appointment.duration_minutes * 60000);

        // Check if time ranges overlap
        if (startDateTime < existingEnd && endDateTime > existingStart) {
          return true; // Conflict found
        }
      }

      return false; // No conflict
    } catch (error) {
      console.error('Appointment conflict check error:', error);
      throw error;
    }
  }

  /**
   * Get appointment summary for customer
   */
  static async getAppointmentSummary(customerId: string): Promise<AppointmentSummary[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          service_type,
          appointment_date,
          appointment_time,
          staff_name,
          total_price,
          status,
          payment_status
        `)
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching appointment summary:', error);
        throw new Error('Failed to fetch appointment summary');
      }

      return data as AppointmentSummary[];
    } catch (error) {
      console.error('Appointment summary fetch error:', error);
      throw error;
    }
  }

  /**
   * Calculate Swiss VAT for appointments (7.7%)
   */
  static calculateVAT(amount: number): number {
    return Math.round(amount * 0.077 * 100) / 100;
  }

  /**
   * Get total with VAT
   */
  static getTotalWithVAT(amount: number): number {
    return Math.round(amount * 1.077 * 100) / 100;
  }

  /**
   * Format currency for Swiss Francs
   */
  static formatSwissCurrency(amount: number): string {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Validate appointment data
   */
  static validateAppointmentData(appointmentData: Partial<Appointment>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!appointmentData.service_type) {
      errors.push('Service-Typ ist erforderlich');
    }

    if (!appointmentData.appointment_date) {
      errors.push('Termindatum ist erforderlich');
    }

    if (!appointmentData.appointment_time) {
      errors.push('Terminzeit ist erforderlich');
    }

    if (!appointmentData.staff_id) {
      errors.push('Mitarbeiter muss ausgewählt werden');
    }

    if (appointmentData.base_price === undefined || appointmentData.base_price < 0) {
      errors.push('Grundpreis muss gültig sein');
    }

    if (appointmentData.total_price === undefined || appointmentData.total_price < 0) {
      errors.push('Gesamtpreis muss gültig sein');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default AppointmentService;