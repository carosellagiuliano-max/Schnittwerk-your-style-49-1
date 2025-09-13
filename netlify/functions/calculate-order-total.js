const { calculateSwissVAT, calculateSwissTotal } = require('./utils/stripe');
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
    validateRequiredFields(body, ['items']);

    const { items, voucherCode } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse(400, 'Items must be a non-empty array');
    }

    const { supabase } = require('./utils/supabase');

    // Calculate subtotal
    let subtotal = 0;
    const detailedItems = [];

    for (const item of items) {
      let itemPrice = 0;
      let itemDetails = null;

      if (item.serviceId) {
        const { data: service } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .eq('id', item.serviceId)
          .single();

        if (!service) {
          return createErrorResponse(404, `Service ${item.serviceId} not found`);
        }

        itemPrice = service.price * (item.quantity || 1);
        itemDetails = {
          type: 'service',
          id: service.id,
          name: service.name,
          price: service.price,
          quantity: item.quantity || 1,
          total: itemPrice,
        };
      } else if (item.productId) {
        const { data: product } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity')
          .eq('id', item.productId)
          .single();

        if (!product) {
          return createErrorResponse(404, `Product ${item.productId} not found`);
        }

        if (product.stock_quantity < (item.quantity || 1)) {
          return createErrorResponse(400, `Insufficient stock for product ${product.name}`);
        }

        itemPrice = product.price * (item.quantity || 1);
        itemDetails = {
          type: 'product',
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity || 1,
          total: itemPrice,
        };
      }

      subtotal += itemPrice;
      detailedItems.push(itemDetails);
    }

    // Apply voucher if provided
    let discountAmount = 0;
    let voucherDetails = null;

    if (voucherCode) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode)
        .eq('is_active', true)
        .single();

      if (voucher) {
        // Check if voucher is valid
        const now = new Date();
        const validFrom = new Date(voucher.valid_from);
        const validTo = new Date(voucher.valid_to);

        if (now >= validFrom && now <= validTo) {
          if (voucher.discount_type === 'percentage') {
            discountAmount = (subtotal * voucher.discount_value) / 100;
          } else if (voucher.discount_type === 'fixed') {
            discountAmount = voucher.discount_value;
          }

          // Ensure discount doesn't exceed subtotal
          discountAmount = Math.min(discountAmount, subtotal);

          voucherDetails = {
            id: voucher.id,
            code: voucher.code,
            discountType: voucher.discount_type,
            discountValue: voucher.discount_value,
            discountAmount,
          };
        }
      }
    }

    // Calculate final amounts
    const discountedSubtotal = subtotal - discountAmount;
    const vatAmount = calculateSwissVAT(discountedSubtotal);
    const totalAmount = calculateSwissTotal(discountedSubtotal);

    return createSuccessResponse({
      subtotal,
      discountAmount,
      vatAmount,
      totalAmount,
      currency: 'CHF',
      items: detailedItems,
      voucher: voucherDetails,
      breakdown: {
        subtotal: discountedSubtotal,
        vat: vatAmount,
        total: totalAmount,
      },
    });

  } catch (error) {
    console.error('Error calculating order total:', error);
    return createErrorResponse(500, 'Failed to calculate order total', error);
  }
};