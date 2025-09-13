/**
 * Swiss formatting utilities for currency, addresses, and compliance
 */

/**
 * Formats a number as Swiss Francs (CHF)
 * @param amount - The amount to format
 * @returns Formatted CHF string
 */
export function formatSwissCurrency(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a Swiss address according to Swiss postal standards
 * @param address - Address object
 * @returns Formatted address string
 */
export function formatSwissAddress(address: {
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  canton?: string;
}): string {
  const { street, houseNumber, postalCode, city, canton } = address;
  const fullStreet = houseNumber ? `${street} ${houseNumber}` : street;
  const cantonPart = canton ? ` ${canton}` : '';
  
  return `${fullStreet}\n${postalCode} ${city}${cantonPart}`;
}

/**
 * Calculates Swiss VAT (7.7% as of 2024)
 * @param amount - The net amount
 * @returns VAT amount
 */
export function calculateSwissVAT(amount: number): number {
  const VAT_RATE = 0.077; // 7.7% Swiss VAT
  return amount * VAT_RATE;
}

/**
 * Formats a Swiss phone number
 * @param phoneNumber - Phone number to format
 * @returns Formatted Swiss phone number
 */
export function formatSwissPhone(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Swiss mobile numbers start with 07x, landlines with 0xx
  if (digits.startsWith('07')) {
    // Mobile: +41 7x xxx xx xx
    return `+41 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  } else if (digits.startsWith('0')) {
    // Landline: +41 xx xxx xx xx
    return `+41 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  
  return phoneNumber;
}

/**
 * Formats a date according to Swiss standards (DD.MM.YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatSwissDate(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a date and time according to Swiss standards
 * @param dateTime - Date and time to format
 * @returns Formatted date and time string
 */
export function formatSwissDateTime(dateTime: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateTime);
}

/**
 * Validates a Swiss postal code
 * @param postalCode - Postal code to validate
 * @returns Whether the postal code is valid
 */
export function isValidSwissPostalCode(postalCode: string): boolean {
  const swissPostalCodeRegex = /^[1-9]\d{3}$/;
  return swissPostalCodeRegex.test(postalCode);
}

/**
 * Gets the canton for a given postal code
 * @param postalCode - Swiss postal code
 * @returns Canton abbreviation or null if not found
 */
export function getCantonByPostalCode(postalCode: string): string | null {
  const postalCodeMap: Record<string, string> = {
    '8001': 'ZH', '8002': 'ZH', '8003': 'ZH', '8004': 'ZH', '8005': 'ZH', '8006': 'ZH',
    '3000': 'BE', '3001': 'BE', '3003': 'BE', '3004': 'BE', '3005': 'BE', '3006': 'BE',
    '4001': 'BS', '4002': 'BS', '4003': 'BS', '4005': 'BS',
    '6000': 'LU', '6002': 'LU', '6003': 'LU', '6004': 'LU', '6005': 'LU', '6006': 'LU',
    '9000': 'SG', '9001': 'SG', '9002': 'SG', '9004': 'SG', '9006': 'SG', '9008': 'SG',
    '7000': 'GR', '7001': 'GR', '7002': 'GR', '7004': 'GR', '7006': 'GR', '7007': 'GR',
    '1000': 'VD', '1001': 'VD', '1002': 'VD', '1003': 'VD', '1004': 'VD', '1005': 'VD',
    '1200': 'GE', '1201': 'GE', '1202': 'GE', '1203': 'GE', '1204': 'GE', '1205': 'GE',
    '6900': 'TI', '6901': 'TI', '6902': 'TI', '6903': 'TI', '6904': 'TI', '6905': 'TI',
  };
  
  return postalCodeMap[postalCode] || null;
}