# Schnittwerk Payment System - Deployment Guide

## Overview
Complete payment processing system for Schnittwerk hair salon with Swiss compliance, Stripe integration, and Netlify serverless functions.

## Prerequisites
- Node.js 18+ 
- Stripe account with Swiss business setup
- Netlify account
- Supabase project
- SMTP email service (for invoice delivery)

## Environment Variables

### Required Environment Variables

#### Stripe Configuration
```bash
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe (Test)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

#### Supabase Configuration
```bash
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Email Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@schnittwerk.ch
```

#### Frontend Environment (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Deployment Steps

### 1. Netlify Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize project
netlify init

# Deploy functions
netlify deploy --prod --functions
```

### 2. Stripe Webhook Configuration
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`

### 3. Supabase Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref [your-project-ref]

# Deploy migrations
supabase db push

# Deploy seed data (optional)
supabase db reset --linked
```

### 4. Deploy Frontend
```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Testing Checklist

### Payment Flow Tests
- [ ] Create payment intent
- [ ] Process successful payment
- [ ] Handle failed payment
- [ ] Process refund
- [ ] Generate invoice
- [ ] Send invoice email
- [ ] Apply voucher discount
- [ ] Calculate Swiss VAT correctly

### Error Handling Tests
- [ ] Invalid voucher code
- [ ] Expired voucher
- [ ] Network failures
- [ ] Stripe API errors
- [ ] Supabase connection issues
- [ ] Email delivery failures

### Swiss Compliance Tests
- [ ] 7.7% VAT calculation
- [ ] CHF currency handling
- [ ] Swiss rounding (0.05 CHF)
- [ ] Invoice format compliance
- [ ] Business details on invoice

## Monitoring Setup

### Error Monitoring
Add to Netlify environment:
```bash
# Sentry (optional)
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
```

### Logging
- All services include comprehensive logging
- Check Netlify Functions logs: `netlify functions:log`
- Monitor Stripe webhooks in dashboard

## Production Checklist

### Security
- [ ] All environment variables set in Netlify
- [ ] Stripe webhook secret configured
- [ ] CORS properly configured
- [ ] Input validation tested
- [ ] Rate limiting enabled

### Performance
- [ ] Functions cold start optimized
- [ ] Database indexes created
- [ ] CDN configured for static assets
- [ ] Image optimization enabled

### Business Setup
- [ ] Swiss business registration verified
- [ ] VAT number registered
- [ ] Bank details updated in configuration
- [ ] Email templates customized
- [ ] Terms and conditions updated

## Rollback Plan

### Quick Rollback
1. Revert to previous deployment in Netlify
2. Update Stripe webhook endpoint if needed
3. Notify customers of any issues

### Database Rollback
```bash
# Rollback last migration
supabase migration repair --status reverted [migration-id]

# Restore from backup
supabase db dump --data-only > backup.sql
```

## Support & Troubleshooting

### Common Issues

#### "Invalid API Key"
- Verify Stripe keys are correct
- Check environment variable names match exactly

#### "Webhook signature verification failed"
- Ensure webhook secret is correct
- Check endpoint URL matches exactly

#### "CORS errors"
- Verify Netlify.toml CORS configuration
- Check frontend API URLs

#### "Database connection failed"
- Verify Supabase credentials
- Check network connectivity
- Ensure IP allowlist includes Netlify

### Getting Help
- Check logs: `netlify functions:log`
- Monitor Stripe dashboard
- Review Supabase logs
- Test with Stripe test cards

## Maintenance

### Regular Tasks
- Monitor failed payments
- Update voucher codes
- Review refund requests
- Check email delivery rates
- Update dependencies monthly

### Monthly Review
- Analyze payment success rates
- Review error logs
- Update Swiss VAT rate if changed
- Check invoice delivery success
- Update business information if needed

## Contact Information
For technical support:
- Email: tech@schnittwerk.ch
- Stripe Support: support.stripe.com
- Netlify Support: netlify.com/support
- Supabase Support: supabase.com/support