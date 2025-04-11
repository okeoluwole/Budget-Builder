import fs from 'fs';
import path from 'path';
import { read, utils } from 'xlsx';
import { db } from '../db';
import { currencyRates, InsertCurrencyRate } from '@shared/schema';

/**
 * Import currency exchange rates from Excel
 * @param filePath Path to the Excel file with currency rate data
 */
export async function importCurrencyRatesFromExcel(filePath: string): Promise<void> {
  console.log("Importing currency rates from:", filePath);
  
  // Read Excel file
  const workbook = read(fs.readFileSync(filePath));
  
  // Find the sheet with FX rates
  const fxRatesSheetName = '2025 FX Rates';
  if (!workbook.SheetNames.includes(fxRatesSheetName)) {
    // Try to find a sheet with a similar name
    const possibleSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('fx') || 
      name.toLowerCase().includes('rate') ||
      name.toLowerCase().includes('currency')
    );
    
    if (possibleSheets.length === 0) {
      throw new Error(`No sheet with FX rates found in ${filePath}`);
    }
    
    console.log(`Using "${possibleSheets[0]}" sheet instead of "${fxRatesSheetName}"`);
    fxRatesSheetName = possibleSheets[0];
  }
  
  // Get the worksheet
  const worksheet = workbook.Sheets[fxRatesSheetName];
  
  // Convert to JSON
  const data = utils.sheet_to_json<{
    COUNTRY: string;
    CURRENCY: string;
    'CURR CODE': string;
    '2nd Pass BUDGET RATE': number;
  }>(worksheet);
  
  console.log(`Found ${data.length} currency records`);
  
  // Clean and validate data
  const records: InsertCurrencyRate[] = [];
  
  for (const row of data) {
    // Skip rows with missing data
    if (!row.COUNTRY || !row.CURRENCY || !row['CURR CODE'] || !row['2nd Pass BUDGET RATE']) {
      continue;
    }
    
    // Create record
    records.push({
      country: row.COUNTRY,
      currencyName: row.CURRENCY,
      currencyCode: row['CURR CODE'],
      exchangeRate: row['2nd Pass BUDGET RATE'].toString(),
    });
  }
  
  console.log(`Prepared ${records.length} valid currency records for import`);
  
  // Bulk insert/update records
  if (records.length > 0) {
    // Delete existing records first
    await db.delete(currencyRates);
    
    // Insert new records
    const result = await db.insert(currencyRates).values(records);
    console.log(`Imported ${records.length} currency rates successfully`);
    return result;
  } else {
    console.log('No valid currency records found to import');
  }
}

/**
 * Get currency exchange rate for a specific currency code
 * @param currencyCode The 3-letter currency code to look up
 * @returns The exchange rate or null if not found
 */
export async function getCurrencyExchangeRate(currencyCode: string): Promise<number | null> {
  const records = await db
    .select({ exchangeRate: currencyRates.exchangeRate })
    .from(currencyRates)
    .where(sql`${currencyRates.currencyCode} = ${currencyCode}`);
  
  if (records.length === 0) {
    return null;
  }
  
  return parseFloat(records[0].exchangeRate);
}

/**
 * Get all available currency rates
 * @returns Array of currency rate objects
 */
export async function getAllCurrencyRates() {
  return db.select().from(currencyRates);
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
  const rate = await getCurrencyExchangeRate(currencyCode);
  
  if (rate === null) {
    return null;
  }
  
  return amountUsd * rate;
}