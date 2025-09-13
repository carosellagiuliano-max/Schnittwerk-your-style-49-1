/**
 * API Service Factory
 * Implements feature flag pattern for seamless switching between mock and real API
 * Based on PLAN.md Sprint A requirements
 */

import { FEATURE_FLAGS } from '@/config/featureFlags';
import { MockAPIService } from './mockService';
import { SupabaseAPIService } from './supabaseService';
import type { APIService } from './mockService';

/**
 * Factory function to create the appropriate API service instance
 * Based on feature flags configuration
 */
export function createAPIService(): APIService {
  const useRealAPI = FEATURE_FLAGS.USE_REAL_API;
  
  if (useRealAPI) {
    console.log('[API Factory] Using Supabase API service');
    return new SupabaseAPIService();
  } else {
    console.log('[API Factory] Using Mock API service');
    return new MockAPIService();
  }
}

// Create singleton instance
export const apiService = createAPIService();

// Export all types and interfaces
export type {
  Customer,
  Product,
  Category,
  Service,
  Appointment,
  Staff,
  StaffSchedule,
  WaitingListEntry,
  AppointmentConflict,
  TimeSlot,
  APIService,
} from './mockService';

// Re-export service classes for testing
export { MockAPIService, SupabaseAPIService };

/**
 * Helper functions for feature flag checks
 */
export const isUsingRealAPI = (): boolean => FEATURE_FLAGS.USE_REAL_API;
export const isUsingMockData = (): boolean => !FEATURE_FLAGS.USE_REAL_API;

/**
 * Switch API service at runtime (useful for testing)
 */
export function switchToMockAPI(): APIService {
  return new MockAPIService();
}

export function switchToSupabaseAPI(): APIService {
  return new SupabaseAPIService();
}

/**
 * API Health Check
 * Tests connectivity to the API service
 */
export async function checkAPIHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  service: 'mock' | 'supabase';
  latency?: number;
  error?: string;
}> {
  const service = isUsingRealAPI() ? 'supabase' : 'mock';
  const startTime = Date.now();
  
  try {
    // Simple health check - try to fetch categories
    await apiService.getCategories();
    
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      service,
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Development utilities
 */
export const developmentUtils = {
  /**
   * Log current API configuration
   */
  logConfiguration() {
    console.group('[API Configuration]');
    console.log('USE_REAL_API:', FEATURE_FLAGS.USE_REAL_API);
    console.log('USE_MOCK_PRODUCTS:', FEATURE_FLAGS.USE_MOCK_PRODUCTS);
    console.log('USE_MOCK_ORDERS:', FEATURE_FLAGS.USE_MOCK_ORDERS);
    console.log('USE_MOCK_PAYMENTS:', FEATURE_FLAGS.USE_MOCK_PAYMENTS);
    console.log('LOG_API_CALLS:', FEATURE_FLAGS.LOG_API_CALLS);
    console.log('MOCK_DELAY:', FEATURE_FLAGS.MOCK_DELAY);
    console.log('Current Service:', isUsingRealAPI() ? 'Supabase' : 'Mock');
    console.groupEnd();
  },

  /**
   * Test API connectivity
   */
  async testConnectivity() {
    console.log('[API Test] Testing connectivity...');
    const health = await checkAPIHealth();
    console.log('[API Test] Health check result:', health);
    return health;
  },

  /**
   * Compare mock vs real API response times
   */
  async comparePerformance() {
    console.log('[API Performance] Comparing mock vs real API...');
    
    // Test mock API
    const mockService = new MockAPIService();
    const mockStart = Date.now();
    await mockService.getCustomers();
    const mockTime = Date.now() - mockStart;
    
    // Test real API (if available)
    let realTime = 'N/A';
    try {
      const realService = new SupabaseAPIService();
      const realStart = Date.now();
      await realService.getCustomers();
      realTime = Date.now() - realStart;
    } catch (error) {
      realTime = `Error: ${error}`;
    }
    
    console.log('[API Performance] Results:', {
      mock: `${mockTime}ms`,
      real: typeof realTime === 'number' ? `${realTime}ms` : realTime,
    });
    
    return { mockTime, realTime };
  },
};

// Only expose development utilities in development mode
if (import.meta.env.DEV) {
  (window as any).apiDev = developmentUtils;
}