import { API_CONFIG } from '@/config/api';

export interface InvoiceRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerAddress?: {
    street: string;
    city: string;
    zipCode: string;
  };
}

export interface InvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  downloadUrl: string;
  createdAt: string;
}

export interface GetInvoiceRequest {
  invoiceId: string;
}

export interface GetInvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  downloadUrl: string;
  status: 'pending' | 'sent' | 'paid';
  createdAt: string;
  sentAt?: string;
}

export interface SendInvoiceRequest {
  invoiceId: string;
  customerEmail: string;
  customerName: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  message: string;
  sentAt: string;
}

class InvoiceService {
  private async fetchApi(endpoint: string, options: RequestInit) {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.data;
  }

  async generateInvoice(request: InvoiceRequest): Promise<InvoiceResponse> {
    return this.fetchApi(API_CONFIG.endpoints.generateInvoice, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendInvoice(request: SendInvoiceRequest): Promise<SendInvoiceResponse> {
    return this.fetchApi(API_CONFIG.endpoints.sendInvoice, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getInvoice(request: GetInvoiceRequest): Promise<GetInvoiceResponse> {
    return this.fetchApi(`${API_CONFIG.endpoints.getInvoice}/${request.invoiceId}`, {
      method: 'GET',
    });
  }

  async generateAndSendInvoice(
    orderId: string,
    customerEmail: string,
    customerName: string,
    customerAddress?: {
      street: string;
      city: string;
      zipCode: string;
    }
  ): Promise<{ invoice: InvoiceResponse; sent: SendInvoiceResponse }> {
    const invoice = await this.generateInvoice({
      orderId,
      customerEmail,
      customerName,
      customerAddress,
    });

    const sent = await this.sendInvoice({
      invoiceId: invoice.invoiceId,
      customerEmail,
      customerName,
    });

    return { invoice, sent };
  }
}

export const invoiceService = new InvoiceService();