/**
 * Currency utility helpers for formatting amounts and symbols.
 * Full support for Indian Rupee (INR / ₹) along with USD, EUR, GBP, JPY, and other globals.
 */

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
];

const SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  SGD: 'S$'
};

/**
 * Returns the symbol for a 3-letter currency code, e.g. '₹' for INR.
 */
export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode) return '$';
  const upper = currencyCode.toUpperCase().trim();
  return SYMBOL_MAP[upper] || upper;
}

/**
 * Format a numeric amount with the proper currency symbol.
 * Example: formatCurrency(25000, 'INR') -> "₹25,000"
 */
export function formatCurrency(amount: number, currencyCode = 'USD', showCode = false): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = Number(amount || 0).toLocaleString();
  if (showCode) {
    return `${symbol}${formatted} ${currencyCode.toUpperCase()}`;
  }
  return `${symbol}${formatted}`;
}
