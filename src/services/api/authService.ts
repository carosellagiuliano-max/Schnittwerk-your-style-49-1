/**
 * Authentication Service
 * Implements Supabase authentication with feature flag support
 * Based on PLAN.md Sprint A authentication requirements
 */

import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'staff' | 'customer';
  phone?: string;
  gender?: 'female' | 'male' | 'child' | 'other';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication Service
 */
export class AuthService {
  private log(method: string, params?: any): void {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[AuthService] ${method}`, params);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    this.log('signIn', { email });

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock authentication for development
      return this.mockSignIn(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Authentication failed');

      // Fetch user profile
      const profile = await this.fetchUserProfile(data.user.id);
      return profile;
    } catch (error) {
      this.log('signIn error', error);
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  /**
   * Sign up new user
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    role: 'customer' | 'staff' = 'customer'
  ): Promise<User> {
    this.log('signUp', { email, fullName, role });

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock registration for development
      return this.mockSignUp(email, fullName, role);
    }

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

      // Profile should be created automatically by trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const profile = await this.fetchUserProfile(data.user.id);
      return profile;
    } catch (error) {
      this.log('signUp error', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    this.log('signOut');

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock sign out
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      this.log('signOut error', error);
      throw new Error(error instanceof Error ? error.message : 'Sign out failed');
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<User | null> {
    this.log('getSession');

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock session - return admin user for development
      return this.getMockUser('admin');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      const profile = await this.fetchUserProfile(session.user.id);
      return profile;
    } catch (error) {
      this.log('getSession error', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.log('onAuthStateChange');

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock auth state changes
      callback(this.getMockUser('admin'));
      return () => {}; // No-op unsubscribe
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        this.log('auth state change', { event, session: !!session });

        if (session?.user) {
          try {
            const profile = await this.fetchUserProfile(session.user.id);
            callback(profile);
          } catch (error) {
            this.log('auth state change error', error);
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    this.log('resetPassword', { email });

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock password reset
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      this.log('resetPassword error', error);
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    this.log('updatePassword');

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock password update
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      this.log('updatePassword error', error);
      throw new Error(error instanceof Error ? error.message : 'Password update failed');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    this.log('updateProfile', updates);

    if (!FEATURE_FLAGS.USE_REAL_API) {
      // Mock profile update
      const mockUser = this.getMockUser('admin');
      return { ...mockUser, ...updates };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          gender: updates.gender,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return this.mapProfileToUser(data);
    } catch (error) {
      this.log('updateProfile error', error);
      throw new Error(error instanceof Error ? error.message : 'Profile update failed');
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: User | null, role: string | string[]): boolean {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  /**
   * Check if user is admin or owner
   */
  isAdminOrOwner(user: User | null): boolean {
    return this.hasRole(user, ['admin', 'owner']);
  }

  /**
   * Check if user is staff member
   */
  isStaff(user: User | null): boolean {
    return this.hasRole(user, ['staff', 'admin', 'owner']);
  }

  // Private helper methods

  private async fetchUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Profile not found');

    return this.mapProfileToUser(data);
  }

  private mapProfileToUser(profile: any): User {
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      phone: profile.phone,
      gender: profile.gender,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  // Mock authentication methods for development

  private async mockSignIn(email: string, password: string): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));

    // Simple mock validation
    if (password === 'admin') {
      return this.getMockUser('admin');
    } else if (password === 'staff') {
      return this.getMockUser('staff');
    } else if (password === 'customer') {
      return this.getMockUser('customer');
    }

    throw new Error('Invalid credentials (use password: admin, staff, or customer)');
  }

  private async mockSignUp(email: string, fullName: string, role: 'customer' | 'staff'): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));

    return {
      id: `mock_${Date.now()}`,
      email,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private getMockUser(role: 'admin' | 'staff' | 'customer'): User {
    const users = {
      admin: {
        id: 'mock_admin',
        email: 'admin@schnittwerk.ch',
        full_name: 'Admin User',
        role: 'admin' as const,
        phone: '+41 79 123 45 67',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      staff: {
        id: 'mock_staff',
        email: 'staff@schnittwerk.ch',
        full_name: 'Staff Member',
        role: 'staff' as const,
        phone: '+41 79 234 56 78',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      customer: {
        id: 'mock_customer',
        email: 'customer@example.com',
        full_name: 'Test Customer',
        role: 'customer' as const,
        phone: '+41 79 345 67 89',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    };

    return users[role];
  }
}

// Create singleton instance
export const authService = new AuthService();