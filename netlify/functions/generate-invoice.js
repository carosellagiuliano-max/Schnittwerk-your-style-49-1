const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { createSuccessResponse, createErrorResponse, validateRequiredFields, getOrderById } = require('./utils/helpers');

const SWISS_CONFIG = {
  businessName: 'Schnittwerk Hair Salon',
  businessAddress: 'Bahnhofstrasse 123',
  businessZip: '8001',
  businessCity: 'Zürich',
  businessCountry: 'Switzerland',
  vatNumber: 'CHE-123.456.789',
  bankDetails: {
    accountHolder: 'Schnittwerk Hair Salon',
    iban: 'CH12 3456 7890 1234 5678 9',
    bic: 'ZKBKCHZZ80A',
    bankName: 'Zürcher Kantonalbank',
  },
};

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

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors
    const black = rgb(0, 0, 0);
    const gray = rgb(0.5, 0.5, 0.5);

    // Header
    let yPosition = height - 50;
    
    // Business info
    page.drawText(SWISS_CONFIG.businessName, {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBoldFont,
      color: black,
    });

    yPosition -= 25;
    page.drawText(`${SWISS_CONFIG.businessAddress}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`${SWISS_CONFIG.businessZip} ${SWISS_CONFIG.businessCity}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`VAT: ${SWISS_CONFIG.vatNumber}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    // Invoice details
    yPosition -= 40;
    page.drawText(`Invoice: ${order.invoice_number || `INV-${order.order_number}`}`, {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: black,
    });

    yPosition -= 20;
    page.drawText(`Order: ${order.order_number}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('de-CH')}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    // Customer info
    yPosition -= 40;
    page.drawText('Bill to:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    });

    yPosition -= 20;
    page.drawText(order.customers?.full_name || 'Customer', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    if (order.customers?.email) {
      yPosition -= 15;
      page.drawText(order.customers.email, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });
    }

    if (order.customers?.phone) {
      yPosition -= 15;
      page.drawText(order.customers.phone, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });
    }

    // Items table
    yPosition -= 40;
    
    // Table headers
    page.drawText('Description', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });
    
    page.drawText('Qty', {
      x: 300,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });
    
    page.drawText('Price', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });
    
    page.drawText('Total', {
      x: 450,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });

    yPosition -= 20;

    // Items
    let totalItems = 0;
    for (const item of order.order_items) {
      const name = item.services?.name || item.products?.name || 'Item';
      const price = item.services?.price || item.products?.price || 0;
      const quantity = item.quantity || 1;
      const total = price * quantity;

      page.drawText(name, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });
      
      page.drawText(quantity.toString(), {
        x: 310,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });
      
      page.drawText(`CHF ${price.toFixed(2)}`, {
        x: 350,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });
      
      page.drawText(`CHF ${total.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: black,
      });

      yPosition -= 15;
      totalItems += total;
    }

    // Totals
    yPosition -= 20;
    
    // Subtotal
    page.drawText('Subtotal:', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });
    
    page.drawText(`CHF ${order.total_amount.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    
    // VAT
    const vatAmount = order.total_amount * 0.077;
    page.drawText('VAT (7.7%):', {
      x: 350,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });
    
    page.drawText(`CHF ${vatAmount.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    
    // Total
    page.drawText('Total:', {
      x: 350,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    });
    
    page.drawText(`CHF ${(order.total_amount + vatAmount).toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: black,
    });

    // Payment info
    yPosition -= 40;
    page.drawText('Payment Terms: Payment due within 30 days', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    // Bank details
    yPosition -= 30;
    page.drawText('Bank Details:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`Bank: ${SWISS_CONFIG.bankDetails.bankName}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`IBAN: ${SWISS_CONFIG.bankDetails.iban}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    yPosition -= 15;
    page.drawText(`BIC: ${SWISS_CONFIG.bankDetails.bic}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');

    // Store in Supabase Storage (if configured)
    const { supabase } = require('./utils/supabase');
    const fileName = `invoice_${order.invoice_number || order.order_number}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    let storageUrl = null;
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);
      storageUrl = urlData.publicUrl;
    }

    return createSuccessResponse({
      pdf: base64Pdf,
      fileName,
      storageUrl,
      orderId,
      invoiceNumber: order.invoice_number || order.order_number,
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return createErrorResponse(500, 'Failed to generate invoice', error);
  }
};