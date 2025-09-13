const { stripe, parseSwissAmount } = require('./utils/stripe');
const { createSuccessResponse, createErrorResponse, validateRequiredFields, getOrderById, updateOrderStatus, createFinancialRecord } = require('./utils/helpers');

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
    validateRequiredFields(body, ['orderId', 'amount']);

    const { orderId, amount, reason = 'requested_by_customer' } = body;

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    if (order.status !== 'paid') {
      return createErrorResponse(400, 'Order is not paid');
    }

    if (!order.stripe_payment_intent_id) {
      return createErrorResponse(400, 'No payment intent found for this order');
    }

    // Calculate refund amount
    const refundAmount = amount || order.total_amount;
    const refundAmountCents = Math.round(refundAmount * 100);

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmountCents,
      reason,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
      },
    });

    // Create financial record
    await createFinancialRecord(orderId, 'refund', -refundAmount, `Refund processed: ${reason}`);

    // Update order status if fully refunded
    if (refundAmount >= order.total_amount) {
      await updateOrderStatus(orderId, 'refunded', {
        refund_date: new Date().toISOString(),
        refund_amount: refundAmount,
      });
    } else {
      await updateOrderStatus(orderId, 'partially_refunded', {
        refund_date: new Date().toISOString(),
        refund_amount: refundAmount,
      });
    }

    return createSuccessResponse({
      refundId: refund.id,
      amount: refundAmount,
      status: refund.status,
      orderId,
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return createErrorResponse(500, 'Failed to process refund', error);
  }
};