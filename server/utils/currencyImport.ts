import * as XLSX from 'xlsx';
import { db } from '../db';
import { insertCurrencyRateSchema, currencyRates, CurrencyRate } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Import currency exchange rates from Excel
 * @param filePath Path to the Excel file with currency rate data
 */
export async function importCurrencyRatesFromExcel(filePath: string): Promise<void> {
  try {
    console.log(`Importing currency rates from ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Look for specific sheets related to currency data
    // Budget Template 1 contains a sheet named 'FX Rates 2025'
    const sheetName = 'FX Rates 2025';
    
    if (!workbook.Sheets[sheetName]) {
      console.error(`Sheet '${sheetName}' not found in Excel file`);
      // Look for any other sheet that might contain currency data
      const availableSheets = workbook.SheetNames;
      console.log(`Available sheets: ${availableSheets.join(', ')}`);
      
      // Try the first sheet as fallback
      if (availableSheets.length > 0) {
        const fallbackSheet = availableSheets[0];
        console.log(`Using ${fallbackSheet} as fallback`);
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[fallbackSheet]);
        console.log('Sample data from fallback sheet:', sheetData.slice(0, 2));
      }
      
      throw new Error(`Currency rates sheet '${sheetName}' not found in Excel file`);
    }
    
    // Convert sheet to JSON
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Found ${sheetData.length} currency rate records in Excel`);
    
    // Sample the data to understand structure
    if (sheetData.length > 0) {
      console.log('Sample currency rate record:', sheetData[0]);
    }
    
    // Process each row and insert into database
    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    
    for (const row of sheetData) {
      // Cast row to a record with string keys
      const rowData = row as Record<string, unknown>;
      
      // Check if row has the expected currency data
      // Adjust property names based on actual Excel structure
      const country = (rowData['Country'] as string) || (rowData['COUNTRY'] as string) || '';
      const currencyName = (rowData['Currency'] as string) || (rowData['CURRENCY'] as string) || '';
      const currencyCode = (rowData['Code'] as string) || (rowData['CODE'] as string) || (rowData['Currency Code'] as string) || '';
      const exchangeRate = parseFloat(String(rowData['2025 FX Rate'] || rowData['Rate'] || rowData['RATE'] || '0'));
      
      if (!country || !currencyName || !currencyCode || isNaN(exchangeRate) || exchangeRate <= 0) {
        console.warn(`Skipping invalid currency row:`, row);
        errorCount++;
        continue;
      }
      
      try {
        // Check if currency already exists
        const existingCurrency = await db.select()
          .from(currencyRates)
          .where(eq(currencyRates.currencyCode, currencyCode));
        
        // Validate data using zod schema
        const currencyData = insertCurrencyRateSchema.parse({
          country,
          currencyName,
          currencyCode,
          exchangeRate
        });
        
        if (existingCurrency.length > 0) {
          // Update existing currency
          await db.update(currencyRates)
            .set(currencyData)
            .where(eq(currencyRates.currencyCode, currencyCode));
          updateCount++;
        } else {
          // Insert new currency
          await db.insert(currencyRates).values(currencyData);
          insertCount++;
        }
      } catch (error) {
        console.error(`Error processing currency row:`, row, error);
        errorCount++;
      }
    }
    
    console.log(`Currency rates import completed: ${insertCount} inserted, ${updateCount} updated, ${errorCount} errors`);
  } catch (error) {
    console.error('Error importing currency rates:', error);
    throw error;
  }
}

/**
 * Get currency exchange rate for a specific currency code
 * @param currencyCode The 3-letter currency code to look up
 * @returns The exchange rate or null if not found
 */
export async function getCurrencyExchangeRate(currencyCode: string): Promise<number | null> {
  try {
    const [rate] = await db.select()
      .from(currencyRates)
      .where(eq(currencyRates.currencyCode, currencyCode));
    
    if (rate) {
      return parseFloat(rate.exchangeRate.toString());
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting exchange rate for ${currencyCode}:`, error);
    return null;
  }
}

/**
 * Get all available currency rates
 * @returns Array of currency rate objects
 */
export async function getAllCurrencyRates(): Promise<CurrencyRate[]> {
  try {
    const rates = await db.select().from(currencyRates);
    return rates;
  } catch (error) {
    console.error('Error getting all currency rates:', error);
    return [];
  }
}

/**
 * Convert an amount in USD to the specified currency
 * @param amountUsd Amount in USD
 * @param currencyCode Target currency code
 * @returns The converted amount or null if exchange rate not found
 */
export async function convertUsdToLocalCurrency(
  amountUsd: number,
  currencyCode: string
): Promise<number | null> {
  try {
    const exchangeRate = await getCurrencyExchangeRate(currencyCode);
    
    if (exchangeRate === null) {
      return null;
    }
    
    return amountUsd * exchangeRate;
  } catch (error) {
    console.error(`Error converting USD to ${currencyCode}:`, error);
    return null;
  }
}