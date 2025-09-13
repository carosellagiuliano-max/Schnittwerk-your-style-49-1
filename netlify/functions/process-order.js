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
    validateRequiredFields(body, ['orderId']);

    const { orderId, action = 'complete' } = body;

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    const { supabase } = require('./utils/supabase');

    switch (action) {
      case 'complete': {
        if (order.status !== 'paid') {
          return createErrorResponse(400, 'Order must be paid before completion');
        }

        // Update order status
        await updateOrderStatus(orderId, 'completed', {
          completed_at: new Date().toISOString(),
        });

        // Create financial record
        await createFinancialRecord(orderId, 'revenue', order.total_amount, 'Order completed');

        // Update product stock
        for (const item of order.order_items) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({
                  stock_quantity: product.stock_quantity - item.quantity,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.product_id);
            }
          }
        }

        // Update voucher usage if used
        if (order.voucher_id) {
          const { data: voucher } = await supabase
            .from('vouchers')
            .select('usage_count')
            .eq('id', order.voucher_id)
            .single();

          if (voucher) {
            await supabase
              .from('vouchers')
              .update({
                usage_count: voucher.usage_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.voucher_id);
          }
        }

        return createSuccessResponse({
          message: 'Order completed successfully',
          orderId,
          status: 'completed',
        });
      }

      case 'cancel': {
        if (order.status === 'completed') {
          return createErrorResponse(400, 'Cannot cancel completed order');
        }

        // Update order status
        await updateOrderStatus(orderId, 'cancelled', {
          cancelled_at: new Date().toISOString(),
          cancellation_reason: body.reason || 'Cancelled by user',
        });

        // Refund if paid
        if (order.status === 'paid' && order.stripe_payment_intent_id) {
          const { stripe } = require('./utils/stripe');
          
          const refund = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            reason: 'requested_by_customer',
          });

          await createFinancialRecord(orderId, 'refund', -order.total_amount, 'Order cancelled');
        }

        return createSuccessResponse({
          message: 'Order cancelled successfully',
          orderId,
          status: 'cancelled',
        });
      }

      case 'schedule': {
        if (!body.appointmentDate) {
          return createErrorResponse(400, 'Appointment date required for scheduling');
        }

        // Update order with appointment details
        await updateOrderStatus(orderId, 'scheduled', {
          appointment_date: body.appointmentDate,
          appointment_time: body.appointmentTime,
          stylist_id: body.stylistId,
          notes: body.notes,
        });

        return createSuccessResponse({
          message: 'Order scheduled successfully',
          orderId,
          status: 'scheduled',
          appointmentDate: body.appointmentDate,
        });
      }

      default:
        return createErrorResponse(400, 'Invalid action');
    }

  } catch (error) {
    console.error('Error processing order:', error);
    return createErrorResponse(500, 'Failed to process order', error);
  }
};