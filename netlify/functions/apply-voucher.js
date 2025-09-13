const { createSuccessResponse, createErrorResponse, validateRequiredFields } = require('./utils/helpers');

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
    validateRequiredFields(body, ['voucherCode', 'subtotal']);

    const { voucherCode, subtotal } = body;

    const { supabase } = require('./utils/supabase');

    // Get voucher details
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', voucherCode)
      .eq('is_active', true)
      .single();

    if (error || !voucher) {
      return createErrorResponse(404, 'Voucher not found or inactive');
    }

    // Check if voucher is valid
    const now = new Date();
    const validFrom = new Date(voucher.valid_from);
    const validTo = new Date(voucher.valid_to);

    if (now < validFrom || now > validTo) {
      return createErrorResponse(400, 'Voucher is not valid at this time');
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return createErrorResponse(400, 'Voucher usage limit reached');
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discount_type === 'percentage') {
      discountAmount = (subtotal * voucher.discount_value) / 100;
    } else if (voucher.discount_type === 'fixed') {
      discountAmount = voucher.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return createSuccessResponse({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discount_type,
        discountValue: voucher.discount_value,
        discountAmount,
        validFrom: voucher.valid_from,
        validTo: voucher.valid_to,
        usageLimit: voucher.usage_limit,
        usageCount: voucher.usage_count,
      },
      subtotal,
      discountAmount,
      finalAmount: subtotal - discountAmount,
    });

  } catch (error) {
    console.error('Error applying voucher:', error);
    return createErrorResponse(500, 'Failed to apply voucher', error);
  }
};