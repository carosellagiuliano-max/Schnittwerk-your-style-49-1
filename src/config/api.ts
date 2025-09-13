import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const API_CONFIG = {
  baseUrl: '/.netlify/functions',
  endpoints: {
    createPaymentIntent: '/stripe-create-payment-intent',
    confirmPayment: '/stripe-confirm-payment',
    processWebhook: '/stripe-webhook',
    processRefund: '/stripe-refund',
    generateInvoice: '/generate-invoice',
    sendInvoice: '/send-invoice-email',
    getInvoice: '/get-invoice',
    applyVoucher: '/apply-voucher',
    calculateTotal: '/calculate-order-total',
    processOrder: '/process-order',
  },
} as const;

export const SWISS_CONFIG = {
  businessName: 'Schnittwerk Hair Salon',
  businessAddress: 'Bahnhofstrasse 123',
  businessZip: '8001',
  businessCity: 'Zürich',
  businessCountry: 'Switzerland',
  vatNumber: 'CHE-123.456.789',
  vatRate: 0.077,
  currency: 'CHF',
  roundingStep: 0.05,
  paymentTerms: 'Zahlbar innert 30 Tagen',
  bankDetails: {
    accountHolder: 'Schnittwerk Hair Salon',
    iban: 'CH12 3456 7890 1234 5678 9',
    bic: 'ZKBKCHZZ80A',
    bankName: 'Zürcher Kantonalbank',
  },
} as const;