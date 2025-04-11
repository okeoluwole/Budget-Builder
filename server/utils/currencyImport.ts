import * as XLSX from 'xlsx';
import { db } from '../db';
import { insertCurrencyRateSchema, currencyRates, CurrencyRate } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

/**
 * Import currency exchange rates from our pre-generated JSON file containing all 2025 FX rates
 * @param jsonFilePath Path to the JSON file with all currency data
 */
export async function importCurrencyRatesFromJson(jsonFilePath: string = 'data/fx_rates_2025.json'): Promise<void> {
  try {
    console.log(`Importing currency rates from JSON: ${jsonFilePath}`);
    
    // Check if the file exists
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Currency rates JSON file not found: ${jsonFilePath}`);
      await importSampleCurrencyRates();
      return;
    }
    
    // Read the JSON file
    const fileData = fs.readFileSync(jsonFilePath, 'utf8');
    const rates = JSON.parse(fileData);
    
    if (!Array.isArray(rates) || rates.length === 0) {
      console.error('Invalid or empty currency rates data in JSON file');
      await importSampleCurrencyRates();
      return;
    }
    
    console.log(`Found ${rates.length} currency rates in JSON file`);
    
    // Delete all existing rates (clean approach to avoid duplicates)
    await db.delete(currencyRates);
    
    // Insert all rates from the JSON file
    let insertCount = 0;
    let errorCount = 0;
    
    for (const rate of rates) {
      try {
        // Validate data using zod schema
        const currencyData = insertCurrencyRateSchema.parse({
          country: rate.country,
          currencyName: rate.currencyName,
          currencyCode: rate.currencyCode,
          exchangeRate: rate.exchangeRate
        });
        
        // Insert new rate
        await db.insert(currencyRates).values(currencyData);
        insertCount++;
      } catch (error) {
        console.error(`Error processing currency rate:`, rate, error);
        errorCount++;
      }
    }
    
    console.log(`Currency rates import from JSON completed: ${insertCount} inserted, ${errorCount} errors`);
  } catch (error) {
    console.error('Error importing currency rates from JSON:', error);
    // Fall back to sample rates if JSON import fails
    await importSampleCurrencyRates();
  }
}

/**
 * Import currency exchange rates from Excel
 * @param filePath Path to the Excel file with currency rate data
 */
export async function importCurrencyRatesFromExcel(filePath: string): Promise<void> {
  try {
    console.log(`Importing currency rates from Excel: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Look for the 2025 FX Rates sheet (used in Budget Template 2)
    let sheetName = '2025 FX Rates';
    
    if (!workbook.Sheets[sheetName]) {
      // Try alternative name (used in Budget Template 1)
      sheetName = 'FX Rates 2025';
      
      if (!workbook.Sheets[sheetName]) {
        console.error(`FX rates sheet not found in Excel file`);
        // Look for any sheet that might contain currency data
        const availableSheets = workbook.SheetNames;
        console.log(`Available sheets: ${availableSheets.join(', ')}`);
        
        // Fall back to loading sample rates
        await importSampleCurrencyRates();
        return;
      }
    }
    
    // Convert sheet to JSON
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Found ${sheetData.length} rows in Excel sheet`);
    
    // Delete all existing rates (clean approach to avoid duplicates)
    await db.delete(currencyRates);
    
    // Process each row and insert into database
    let insertCount = 0;
    let errorCount = 0;
    
    // Find header row to determine column structure
    let headerRowIndex = -1;
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i] as Record<string, unknown>;
      if (row['COUNTRY'] || row['Country']) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.error('Could not find header row in Excel sheet');
      await importSampleCurrencyRates();
      return;
    }
    
    // Skip the header row and process all data rows
    for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
      const rowData = sheetData[i] as Record<string, unknown>;
      
      // Check if row has the expected currency data
      const country = (rowData['Country'] as string) || (rowData['COUNTRY'] as string) || '';
      const currencyName = (rowData['Currency'] as string) || (rowData['CURRENCY'] as string) || '';
      const currencyCode = (rowData['Code'] as string) || (rowData['CODE'] as string) || (rowData['Currency Code'] as string) || '';
      
      // Check for 2nd Pass Budget Rate (6th column/index 5) first, then fall back to other potential rate columns
      // The following checks all possible column names for the rate, including array indexing for unnamed columns
      let exchangeRate = 0;
      // Try the 6th column (index 5) for 2nd Pass Budget Rate
      if (rowData[5] !== undefined && !isNaN(parseFloat(String(rowData[5])))) {
        exchangeRate = parseFloat(String(rowData[5]));
      } else if (rowData['RATE'] !== undefined && !isNaN(parseFloat(String(rowData['RATE'])))) {
        exchangeRate = parseFloat(String(rowData['RATE']));
      } else if (rowData['Rate'] !== undefined && !isNaN(parseFloat(String(rowData['Rate'])))) {
        exchangeRate = parseFloat(String(rowData['Rate']));
      } else if (rowData['2025 FX Rate'] !== undefined && !isNaN(parseFloat(String(rowData['2025 FX Rate'])))) {
        exchangeRate = parseFloat(String(rowData['2025 FX Rate']));
      }
      
      if (!country || !currencyName || !currencyCode || isNaN(exchangeRate) || exchangeRate <= 0) {
        console.warn(`Skipping invalid currency row at index ${i}:`, rowData);
        errorCount++;
        continue;
      }
      
      try {
        // Validate data using zod schema
        const currencyData = insertCurrencyRateSchema.parse({
          country,
          currencyName,
          currencyCode,
          exchangeRate
        });
        
        // Insert new currency
        await db.insert(currencyRates).values(currencyData);
        insertCount++;
      } catch (error) {
        console.error(`Error processing currency row:`, rowData, error);
        errorCount++;
      }
    }
    
    console.log(`Currency rates import from Excel completed: ${insertCount} inserted, ${errorCount} errors`);
  } catch (error) {
    console.error('Error importing currency rates from Excel:', error);
    // Fall back to sample rates
    await importSampleCurrencyRates();
  }
}

/**
 * Import a curated set of sample currency rates as a fallback
 * Uses the 2025 FX rates from the Budget Template
 */
async function importSampleCurrencyRates(): Promise<void> {
  try {
    console.log('Importing sample currency rates as fallback');
    
    // Delete all existing rates
    await db.delete(currencyRates);
    
    // Sample of 2025 FX rates from the Budget Template
    const sampleRates = [
      { country: 'EURO', currencyName: 'EURO', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'United Kingdom', currencyName: 'POUND', currencyCode: 'GBP', exchangeRate: 1.27 },
      { country: 'Ireland', currencyName: 'Euro', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'France', currencyName: 'Euro', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'Germany', currencyName: 'Euro', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'Italy', currencyName: 'Euro', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'Spain', currencyName: 'Euro', currencyCode: 'EUR', exchangeRate: 1.05 },
      { country: 'United States', currencyName: 'DOLLAR', currencyCode: 'USD', exchangeRate: 1.0 },
      { country: 'Canada', currencyName: 'DOLLAR', currencyCode: 'CAD', exchangeRate: 0.7335 },
      { country: 'Australia', currencyName: 'DOLLAR', currencyCode: 'AUD', exchangeRate: 0.65 },
      { country: 'China', currencyName: 'YUAN', currencyCode: 'CNY', exchangeRate: 0.139 },
      { country: 'Japan', currencyName: 'YEN', currencyCode: 'JPY', exchangeRate: 0.00662 },
      { country: 'India', currencyName: 'RUPEE', currencyCode: 'INR', exchangeRate: 0.01203 },
      { country: 'Singapore', currencyName: 'DOLLAR', currencyCode: 'SGD', exchangeRate: 0.74 },
      { country: 'Mexico', currencyName: 'PESO', currencyCode: 'MXN', exchangeRate: 0.0594 },
      { country: 'Brazil', currencyName: 'REAL', currencyCode: 'BRL', exchangeRate: 0.186 },
      { country: 'South Africa', currencyName: 'RAND', currencyCode: 'ZAR', exchangeRate: 0.054 },
    ];
    
    let insertCount = 0;
    
    for (const rate of sampleRates) {
      try {
        // Validate and insert
        const currencyData = insertCurrencyRateSchema.parse(rate);
        await db.insert(currencyRates).values(currencyData);
        insertCount++;
      } catch (error) {
        console.error(`Error inserting sample rate:`, rate, error);
      }
    }
    
    console.log(`Sample currency rates import completed: ${insertCount} inserted`);
  } catch (error) {
    console.error('Error importing sample currency rates:', error);
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