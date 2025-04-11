/**
 * Format a number as currency
 * @param value The number to format
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
    // Format exactly as in the screenshot (US$40,017,661)
    if (currencyCode === 'USD') {
      return `US$${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        ...options
      })}`;
    } else if (currencyCode === 'EUR') {
      return `€${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        ...options
      })}`;
    } else {
      // For any other currency
      return `${currencyCode}${value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true,
        ...options
      })}`;
    }
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
