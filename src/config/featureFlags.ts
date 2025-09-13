/**
 * Feature Flag Configuration
 * Controls switching between mock and real API endpoints
 */

export const FEATURE_FLAGS = {
  // Enable/disable real API integration
  USE_REAL_API: import.meta.env.VITE_USE_REAL_API === 'true',
  
  // Mock data sources
  USE_MOCK_PRODUCTS: import.meta.env.VITE_USE_MOCK_PRODUCTS !== 'false',
  USE_MOCK_ORDERS: import.meta.env.VITE_USE_MOCK_ORDERS !== 'false',
  USE_MOCK_PAYMENTS: import.meta.env.VITE_USE_MOCK_PAYMENTS !== 'false',
  
  // Development helpers
  LOG_API_CALLS: import.meta.env.VITE_LOG_API_CALLS === 'true',
  MOCK_DELAY: parseInt(import.meta.env.VITE_MOCK_DELAY || '500', 10),
} as const;

// Environment detection
export const ENVIRONMENT = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTesting: import.meta.env.MODE === 'test',
} as const;

// Feature flag helpers
export const shouldUseRealApi = () => FEATURE_FLAGS.USE_REAL_API;
export const shouldUseMockData = () => !FEATURE_FLAGS.USE_REAL_API;
export const shouldLogApiCalls = () => FEATURE_FLAGS.LOG_API_CALLS;