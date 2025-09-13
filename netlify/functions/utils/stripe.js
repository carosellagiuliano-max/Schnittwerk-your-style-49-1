const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is missing');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

const SWISS_VAT_RATE = 0.077; // 7.7% Swiss VAT
const SWISS_ROUNDING_STEP = 0.05; // Swiss rounding to nearest 0.05 CHF

function calculateSwissVAT(amount) {
  const vatAmount = amount * SWISS_VAT_RATE;
  return Math.round(vatAmount / SWISS_ROUNDING_STEP) * SWISS_ROUNDING_STEP;
}

function calculateSwissTotal(subtotal) {
  const vatAmount = calculateSwissVAT(subtotal);
  const total = subtotal + vatAmount;
  return Math.round(total / SWISS_ROUNDING_STEP) * SWISS_ROUNDING_STEP;
}

function formatSwissAmount(amount) {
  return Math.round(amount * 100); // Convert to cents for Stripe
}

function parseSwissAmount(amount) {
  return amount / 100; // Convert from cents to CHF
}

module.exports = {
  stripe,
  webhookSecret,
  calculateSwissVAT,
  calculateSwissTotal,
  formatSwissAmount,
  parseSwissAmount,
  SWISS_VAT_RATE,
};