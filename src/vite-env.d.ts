/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_USE_REAL_API?: string
  readonly VITE_USE_MOCK_PRODUCTS?: string
  readonly VITE_USE_MOCK_ORDERS?: string
  readonly VITE_USE_MOCK_PAYMENTS?: string
  readonly VITE_LOG_API_CALLS?: string
  readonly VITE_MOCK_DELAY?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
