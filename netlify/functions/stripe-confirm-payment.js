const { stripe } = require('./utils/stripe');
const { createSuccessResponse, createErrorResponse, validateRequiredFields, getOrderById, updateOrderStatus } = require('./utils/helpers');

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
    validateRequiredFields(body, ['paymentIntentId', 'orderId']);

    const { paymentIntentId, orderId } = body;

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return createErrorResponse(404, 'Payment intent not found');
    }

    // Verify payment intent belongs to this order
    if (paymentIntent.metadata.orderId !== orderId) {
      return createErrorResponse(400, 'Payment intent does not match order');
    }

    let response = {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };

    // Handle different payment states
    switch (paymentIntent.status) {
      case 'succeeded':
        await updateOrderStatus(orderId, 'paid', {
          payment_date: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        });
        response.message = 'Payment confirmed successfully';
        break;

      case 'processing':
        await updateOrderStatus(orderId, 'processing_payment');
        response.message = 'Payment is being processed';
        break;

      case 'requires_payment_method':
        await updateOrderStatus(orderId, 'payment_failed', {
          payment_error: 'Payment method required',
        });
        response.message = 'Payment requires payment method';
        break;

      case 'requires_action':
        response.message = 'Payment requires additional action';
        response.nextAction = paymentIntent.next_action;
        break;

      default:
        response.message = `Payment status: ${paymentIntent.status}`;
    }

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error confirming payment:', error);
    return createErrorResponse(500, 'Failed to confirm payment', error);
  }
};