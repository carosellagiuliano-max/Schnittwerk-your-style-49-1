const { stripe, webhookSecret, parseSwissAmount } = require('./utils/stripe');
const { updateOrderStatus, createFinancialRecord } = require('./utils/helpers');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          console.error('No orderId in payment intent metadata');
          return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId' }) };
        }

        // Update order status
        await updateOrderStatus(orderId, 'paid', {
          payment_date: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
        });

        // Create financial record
        const amount = parseSwissAmount(paymentIntent.amount);
        await createFinancialRecord(orderId, 'payment', amount, 'Payment received via Stripe');

        console.log(`Payment succeeded for order ${orderId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object;
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          console.error('No orderId in payment intent metadata');
          return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId' }) };
        }

        // Update order status
        await updateOrderStatus(orderId, 'payment_failed', {
          payment_error: paymentIntent.last_payment_error?.message || 'Payment failed',
        });

        console.log(`Payment failed for order ${orderId}`);
        break;
      }

      case 'charge.refunded': {
        const refund = stripeEvent.data.object;
        const paymentIntent = await stripe.paymentIntents.retrieve(refund.payment_intent);
        const orderId = paymentIntent.metadata.orderId;
        
        if (!orderId) {
          console.error('No orderId in payment intent metadata');
          return { statusCode: 400, body: JSON.stringify({ error: 'Missing orderId' }) };
        }

        const refundAmount = parseSwissAmount(refund.amount_refunded);
        
        // Create financial record for refund
        await createFinancialRecord(orderId, 'refund', -refundAmount, 'Refund processed via Stripe');

        // Update order status if fully refunded
        if (refund.amount_refunded === paymentIntent.amount) {
          await updateOrderStatus(orderId, 'refunded');
        }

        console.log(`Refund processed for order ${orderId}: ${refundAmount} CHF`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    };
  }
};