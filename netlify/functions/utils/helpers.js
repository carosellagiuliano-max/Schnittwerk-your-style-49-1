const { supabase } = require('./supabase');

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(statusCode, message, error = null) {
  return createResponse(statusCode, {
    success: false,
    error: {
      message,
      details: error?.message || null,
    },
  });
}

function createSuccessResponse(data) {
  return createResponse(200, {
    success: true,
    data,
  });
}

function validateRequiredFields(body, requiredFields) {
  const missingFields = requiredFields.filter(field => !body[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        services (*),
        products (*)
      ),
      customers (*),
      vouchers (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

async function updateOrderStatus(orderId, status, metadata = {}) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...metadata,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createFinancialRecord(orderId, type, amount, description) {
  const { data, error } = await supabase
    .from('financial_records')
    .insert({
      order_id: orderId,
      type,
      amount,
      description,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createResponse,
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
  getOrderById,
  updateOrderStatus,
  createFinancialRecord,
};