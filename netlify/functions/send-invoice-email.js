const nodemailer = require('nodemailer');
const { createSuccessResponse, createErrorResponse, validateRequiredFields, getOrderById } = require('./utils/helpers');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    validateRequiredFields(body, ['orderId', 'pdfBase64']);

    const { orderId, pdfBase64 } = body;

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return createErrorResponse(404, 'Order not found');
    }

    const customerEmail = order.customers?.email;
    if (!customerEmail) {
      return createErrorResponse(400, 'Customer email not found');
    }

    const customerName = order.customers?.full_name || 'Customer';

    // Email content
    const subject = `Invoice ${order.invoice_number || order.order_number} - Schnittwerk Hair Salon`;
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #000;">Thank you for your purchase!</h2>
            
            <p>Dear ${customerName},</p>
            
            <p>Thank you for choosing Schnittwerk Hair Salon. Please find your invoice attached to this email.</p>
            
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Order Number:</strong> ${order.order_number}</li>
              <li><strong>Invoice Number:</strong> ${order.invoice_number || order.order_number}</li>
              <li><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('de-CH')}</li>
              <li><strong>Total Amount:</strong> CHF ${order.total_amount.toFixed(2)}</li>
            </ul>
            
            <h3>Payment Information:</h3>
            <p>Payment is due within 30 days. Please use the following bank details:</p>
            <ul>
              <li><strong>Bank:</strong> Zürcher Kantonalbank</li>
              <li><strong>IBAN:</strong> CH12 3456 7890 1234 5678 9</li>
              <li><strong>BIC:</strong> ZKBKCHZZ80A</li>
              <li><strong>Account Holder:</strong> Schnittwerk Hair Salon</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            Schnittwerk Hair Salon Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Schnittwerk Hair Salon<br>
              Bahnhofstrasse 123<br>
              8001 Zürich<br>
              Switzerland<br>
              VAT: CHE-123.456.789
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Schnittwerk Hair Salon'}" <${process.env.FROM_EMAIL || 'noreply@schnittwerk.ch'}>`,
      to: customerEmail,
      subject,
      html,
      attachments: [
        {
          filename: `invoice_${order.invoice_number || order.order_number}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    // Update order with email sent status
    const { supabase } = require('./utils/supabase');
    await supabase
      .from('orders')
      .update({
        invoice_sent: true,
        invoice_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return createSuccessResponse({
      message: 'Invoice sent successfully',
      messageId: info.messageId,
      customerEmail,
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return createErrorResponse(500, 'Failed to send invoice email', error);
  }
};