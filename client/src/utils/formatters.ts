/**
 * Format a number as currency
 * @param value The number to format
 * @param currencyCode The currency code (USD, EUR, GBP, etc.)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
// FX rate for EUR to USD from the 2025 Budget Template's 2nd Pass Budget Rate column
const EUR_RATE = 1.05;

// Country to currency code mapping for common European countries
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'Ireland': 'EUR',
  'France': 'EUR',
  'Germany': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Portugal': 'EUR',
  'Austria': 'EUR',
  'Finland': 'EUR',
  'Greece': 'EUR',
  'United Kingdom': 'GBP',
  // Add more as needed
};

// Currency code to symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': 'US$',
  'EUR': '€',
  'GBP': '£',
  // Add more as needed
};

// Currency code to exchange rate mapping (2nd Pass Budget Rate from 2025 FX Rates)
const CURRENCY_RATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 1.05, // EUR to USD rate
  'GBP': 1.27, // GBP to USD rate
  // Add more as needed
};

/**
 * Get the currency code for a country
 * @param country The country name
 * @returns The currency code or USD as fallback
 */
export const getCurrencyCodeForCountry = (country: string): string => {
  if (!country) return 'USD';
  return COUNTRY_TO_CURRENCY[country] || 'USD';
};

/**
 * Get the exchange rate for a currency code (USD to the specified currency)
 * @param currencyCode The target currency code
 * @returns The exchange rate or 1.0 as fallback
 */
export const getExchangeRate = (currencyCode: string): number => {
  if (!currencyCode) return 1.0;
  return CURRENCY_RATES[currencyCode] || 1.0;
};

/**
 * Format a currency value
 * @param value The value to format
 * @param currencyCode The currency code (USD, EUR, GBP, etc.)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currencyCode: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    // Get the currency symbol
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    
    // Format with the appropriate currency symbol
    return `${symbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
      ...options
    })}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyCode}${value.toLocaleString()}`;
  }
};

/**
 * Format a number with a specific number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return value.toFixed(decimals);
  }
};

/**
 * Format a percentage
 * @param value The decimal value (e.g., 0.75 for 75%)
 * @param decimals The number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    return `${(value * 100).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

/**
 * Format a date
 * @param date The date to format
 * @param format The format style
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  if (!date) return '—';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const options: Intl.DateTimeFormatOptions = 
      format === 'short' ? { day: 'numeric', month: 'numeric', year: 'numeric' } :
      format === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' } :
      { day: 'numeric', month: 'short', year: 'numeric' };

    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toString();
  }
};

/**
 * Format area based on area unit
 * @param value The area value
 * @param unit The area unit ('sqm' or 'sqft')
 * @returns Formatted area string
 */
export const formatArea = (value: number, unit: 'sqm' | 'sqft'): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    return `${value.toLocaleString()} ${unit === 'sqm' ? 'm²' : 'ft²'}`;
  } catch (error) {
    console.error('Error formatting area:', error);
    return `${value} ${unit}`;
  }
};

/**
 * Convert a number to a compact format (e.g., 1.2k, 3.4M)
 * @param value The number to format
 * @returns Formatted compact number string
 */
export const formatCompactNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  try {
    const formatter = new Intl.NumberFormat('en', { notation: 'compact' });
    return formatter.format(value);
  } catch (error) {
    console.error('Error formatting compact number:', error);
    
    // Fallback implementation
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    } else {
      return value.toString();
    }
  }
};
