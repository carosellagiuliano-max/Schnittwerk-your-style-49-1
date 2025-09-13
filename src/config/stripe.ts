import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not defined');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const STRIPE_CONFIG = {
  currency: 'chf',
  locale: 'de-CH',
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  },
  paymentMethodTypes: ['card'],
} as const;

export const SWISS_VAT_RATE = 0.077; // 7.7% Swiss VAT
export const SWISS_ROUNDING_STEP = 0.05; // Swiss rounding to nearest 0.05 CHF