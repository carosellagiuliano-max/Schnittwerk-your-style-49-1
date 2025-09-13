import { API_CONFIG } from '@/config/api';

export interface VoucherRequest {
  code: string;
  orderTotal: number;
}

export interface VoucherResponse {
  valid: boolean;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue?: number;
  expiryDate?: string;
  message?: string;
}

export interface VoucherDetails {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
}

class VoucherService {
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

  async applyVoucher(code: string, orderTotal: number): Promise<VoucherResponse> {
    return this.fetchApi(API_CONFIG.endpoints.applyVoucher, {
      method: 'POST',
      body: JSON.stringify({ code, orderTotal }),
    });
  }

  async validateVoucher(code: string, orderTotal: number): Promise<VoucherResponse> {
    try {
      return await this.applyVoucher(code, orderTotal);
    } catch (error) {
      return {
        valid: false,
        discountAmount: 0,
        discountType: 'percentage',
        discountValue: 0,
        message: error instanceof Error ? error.message : 'Invalid voucher',
      };
    }
  }

  formatDiscount(voucher: VoucherResponse): string {
    if (!voucher.valid) return '';
    
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}% Rabatt`;
    } else {
      return `CHF ${voucher.discountAmount.toFixed(2)} Rabatt`;
    }
  }

  calculateDiscountedPrice(originalPrice: number, voucher: VoucherResponse): number {
    if (!voucher.valid) return originalPrice;
    
    return Math.max(0, originalPrice - voucher.discountAmount);
  }
}

export const voucherService = new VoucherService();