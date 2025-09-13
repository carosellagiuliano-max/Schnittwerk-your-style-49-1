const { stripe, formatSwissAmount, calculateSwissTotal } = require('./utils/stripe');
const { createSuccessResponse, createErrorResponse, validateRequiredFields, getOrderById } = require('./utils/helpers');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const body = JSON.parse(event.body);
    validateRequiredFields(body, ['orderId']);

    const { orderId } = body;

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    // Calculate total with Swiss VAT
    const subtotal = order.total_amount;
    const totalWithVAT = calculateSwissTotal(subtotal);
    const amountInCents = formatSwissAmount(totalWithVAT);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'chf',
      metadata: {
        orderId: order.id,
        customerId: order.customer_id,
        orderNumber: order.order_number,
      },
      description: `Order ${order.order_number} - ${order.customers?.full_name || 'Customer'}`,
    });

    // Update order with payment intent ID
    const { supabase } = require('./utils/supabase');
    await supabase
      .from('orders')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return createSuccessResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalWithVAT,
      currency: 'CHF',
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return createErrorResponse(500, 'Failed to create payment intent', error);
  }
};