import { db } from '../db';
import { furnitureCosts } from '@shared/schema';
import { parseExcelFile, sheetToJson } from './excelReader';
import * as fs from 'fs';
import path from 'path';
import { eq, sql, count } from 'drizzle-orm';

/**
 * Find a matching row in another sheet based on country and city
 * @param data Array of row objects from an Excel sheet
 * @param country Country name to match
 * @param city City name to match
 * @returns Matching row or empty object if not found
 */
function findMatchingRow(data: any[], country: string, city: string): any {
  return data.find((row: any) => 
    row['COUNTRY'] === country && 
    row['CITY'] === city
  ) || {};
}

/**
 * Convert various number formats to a numeric value
 * @param value Value to convert to a number
 * @returns Number or null if conversion fails
 */
function convertNumberField(value: any): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, etc.
    const cleanValue = value.replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleanValue);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Import furniture cost data from Excel
 * @param filePath Path to the Excel file
 */
export async function importFurnitureCostsFromExcel(filePath: string): Promise<void> {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    
    // Read the Excel file
    const xlsx = await parseExcelFile(filePath);
    
    // Get all sheet names
    console.log('Available sheets:', xlsx.SheetNames);
    
    // Extract data from each sheet
    const activitySqmData = xlsx.Sheets['Table 1_Activity BYOB Sqm'];
    const activitySqftData = xlsx.Sheets['Table 1_Activity BYOB SqFt'];
    const teamSqmData = xlsx.Sheets['Table 2_Team BYOB Sqm'];
    const teamSqftData = xlsx.Sheets['Table 2_Team BYOB SqFt'];
    const eventSqmData = xlsx.Sheets['Table 3_Event BYOB Sqm'];
    const eventSqftData = xlsx.Sheets['Table 3_Event BYOB SqFt'];
    
    // Convert sheet data to JSON
    const activitySqmJson = sheetToJson(activitySqmData);
    const activitySqftJson = sheetToJson(activitySqftData);
    const teamSqmJson = sheetToJson(teamSqmData);
    const teamSqftJson = sheetToJson(teamSqftData);
    const eventSqmJson = sheetToJson(eventSqmData);
    const eventSqftJson = sheetToJson(eventSqftData);
    
    // Log the first row to understand the structure
    console.log('First row from Activity SQM furniture sheet:', activitySqmJson[0]);
    
    // Skip header and find first data row for debugging
    // Log a few rows to understand the structure
    for (let i = 0; i < Math.min(5, activitySqmJson.length); i++) {
      console.log(`Row ${i} from furniture data:`, activitySqmJson[i]);
    }
    
    // Find benchmark cities to calculate location factors
    const newyorkRow = activitySqmJson.find((row: any) => 
      row['COUNTRY'] === 'United States' && row['CITY'] === 'New York'
    );
    const singaporeRow = activitySqmJson.find((row: any) => 
      row['COUNTRY'] === 'Singapore' && row['CITY'] === 'Singapore'
    );
    const londonRow = activitySqmJson.find((row: any) => 
      row['COUNTRY'] === 'United Kingdom' && row['CITY'] === 'London'
    );
    
    const newyorkMedium = newyorkRow?.['MEDIUM'] || 0;
    const singaporeMedium = singaporeRow?.['MEDIUM'] || 0;
    const londonMedium = londonRow?.['MEDIUM'] || 0;
    
    if (newyorkMedium > 0) {
      console.log('Found New York benchmark:', newyorkMedium);
    }
    if (singaporeMedium > 0) {
      console.log('Found Singapore benchmark:', singaporeMedium);
    }
    if (londonMedium > 0) {
      console.log('Found London benchmark:', londonMedium);
    }
    
    // Clear existing furniture cost data
    await db.delete(furnitureCosts);
    console.log('Cleared existing furniture cost records');
    
    // Process each row in the Activity SQM sheet as it has all the required city data
    for (const activitySqmRow of activitySqmJson) {
      // Skip headers or empty rows
      if (!activitySqmRow['COUNTRY'] || !activitySqmRow['CITY']) {
        continue;
      }
      
      const country = String(activitySqmRow['COUNTRY']);
      const city = String(activitySqmRow['CITY']);
      const region = String(activitySqmRow['REGION']);
      
      // Find matching rows in other sheets
      const activitySqftRow = findMatchingRow(activitySqftJson, country, city);
      const teamSqmRow = findMatchingRow(teamSqmJson, country, city);
      const teamSqftRow = findMatchingRow(teamSqftJson, country, city);
      const eventSqmRow = findMatchingRow(eventSqmJson, country, city);
      const eventSqftRow = findMatchingRow(eventSqftJson, country, city);
      
      // Set location factors based on region & the benchmark cities
      // Calculate location factors based on the medium cost relative to benchmark cities
      const cityMedium = Number(activitySqmRow['MEDIUM'] || 0);
      
      // Default location factors
      let locationFactorEMEA = 1.0;
      let locationFactorAMERICA = 1.0;
      let locationFactorAPAC = 1.0;
      
      // Only calculate if we have valid data for this city
      if (cityMedium > 0) {
        // Calculate relative factors based on the reference cities
        // This allows us to derive location factors without having them explicitly in the data
        if (region === 'EMEA') {
          // For EMEA cities, London is the reference with factor 1.0
          locationFactorEMEA = cityMedium / londonMedium;
          locationFactorAMERICA = (cityMedium / newyorkMedium) * (londonMedium / newyorkMedium);
          locationFactorAPAC = (cityMedium / singaporeMedium) * (londonMedium / singaporeMedium);
        } else if (region === 'AMERICAS') {
          // For AMERICAS cities, New York is the reference with factor 1.0
          locationFactorEMEA = (cityMedium / londonMedium) * (newyorkMedium / londonMedium);
          locationFactorAMERICA = cityMedium / newyorkMedium;
          locationFactorAPAC = (cityMedium / singaporeMedium) * (newyorkMedium / singaporeMedium);
        } else if (region === 'APAC') {
          // For APAC cities, Singapore is the reference with factor 1.0
          locationFactorEMEA = (cityMedium / londonMedium) * (singaporeMedium / londonMedium);
          locationFactorAMERICA = (cityMedium / newyorkMedium) * (singaporeMedium / newyorkMedium);
          locationFactorAPAC = cityMedium / singaporeMedium;
        }
      } else {
        // If no valid cost data, use regional averages
        if (region === 'EMEA') {
          locationFactorEMEA = 1.0;
          locationFactorAMERICA = 0.7;
          locationFactorAPAC = 1.16;
        } else if (region === 'AMERICAS') {
          locationFactorEMEA = 1.44;
          locationFactorAMERICA = 1.0;
          locationFactorAPAC = 1.67;
        } else if (region === 'APAC') {
          locationFactorEMEA = 0.86;
          locationFactorAMERICA = 0.6;
          locationFactorAPAC = 1.0;
        }
      }
      
      // Log a sample of processed data
      if (city === 'Cincinnati' || city === 'London' || city === 'Singapore') {
        console.log(`Record for ${country}/${city}: Region=${region}, Activity Medium=${cityMedium.toFixed(2)}`);
        console.log(`Location factors: EMEA=${locationFactorEMEA.toFixed(2)}, AMERICA=${locationFactorAMERICA.toFixed(2)}, APAC=${locationFactorAPAC.toFixed(2)}`);
      }
      
      try {
        // Create and insert the record
        await db.insert(furnitureCosts).values({
          country,
          city,
          region,
          
          // Activity costs from Activity SQM/SQFT sheets
          activityLowSqm: convertNumberField(activitySqmRow['LOW']),
          activityMediumSqm: convertNumberField(activitySqmRow['MEDIUM']),
          activityHighSqm: convertNumberField(activitySqmRow['HIGH']),
          activityLowSqft: convertNumberField(activitySqftRow['LOW']),
          activityMediumSqft: convertNumberField(activitySqftRow['MEDIUM']),
          activityHighSqft: convertNumberField(activitySqftRow['HIGH']),
          
          // Team costs from Team SQM/SQFT sheets
          teamLowSqm: convertNumberField(teamSqmRow['LOW']),
          teamMediumSqm: convertNumberField(teamSqmRow['MEDIUM']),
          teamHighSqm: convertNumberField(teamSqmRow['HIGH']),
          teamLowSqft: convertNumberField(teamSqftRow['LOW']),
          teamMediumSqft: convertNumberField(teamSqftRow['MEDIUM']),
          teamHighSqft: convertNumberField(teamSqftRow['HIGH']),
          
          // Event costs from Event SQM/SQFT sheets
          eventLowSqm: convertNumberField(eventSqmRow['LOW']),
          eventMediumSqm: convertNumberField(eventSqmRow['MEDIUM']),
          eventHighSqm: convertNumberField(eventSqmRow['HIGH']),
          eventLowSqft: convertNumberField(eventSqftRow['LOW']),
          eventMediumSqft: convertNumberField(eventSqftRow['MEDIUM']),
          eventHighSqft: convertNumberField(eventSqftRow['HIGH']),
          
          // Location factors
          locationFactorEMEA: locationFactorEMEA,
          locationFactorAMERICA: locationFactorAMERICA,
          locationFactorAPAC: locationFactorAPAC
        });
      } catch (error) {
        console.error(`Error inserting furniture cost for ${country}/${city}:`, error);
        // Continue with other records even if one fails
      }
    }
    
    // Count the number of records inserted
    const result = await db.select({ 
      value: count() 
    }).from(furnitureCosts);
    
    console.log(`Imported ${result[0]?.value || 0} furniture cost records`);
    
  } catch (error) {
    console.error('Error importing furniture costs:', error);
    throw error;
  }
}

/**
 * Validate furniture dataset file
 * @param filePath Path to the furniture dataset Excel file
 */
export async function validateFurnitureDataset(filePath: string = 'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx'): Promise<boolean> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Furniture dataset file not found: ${filePath}`);
      return false;
    }
    
    // Parse the Excel file
    const xlsx = await parseExcelFile(filePath);
    
    // Check required sheets
    const requiredSheets = [
      'Table 1_Activity BYOB Sqm',
      'Table 1_Activity BYOB SqFt',
      'Table 2_Team BYOB Sqm',
      'Table 2_Team BYOB SqFt',
      'Table 3_Event BYOB Sqm',
      'Table 3_Event BYOB SqFt'
    ];
    
    for (const sheet of requiredSheets) {
      if (!xlsx.SheetNames.includes(sheet)) {
        console.error(`Required sheet missing: ${sheet}`);
        return false;
      }
    }
    
    // Check a sample of data from the first sheet
    const activitySqmData = xlsx.Sheets['Table 1_Activity BYOB Sqm'];
    const activitySqmJson = sheetToJson(activitySqmData);
    
    // Ensure we have some data rows
    if (!activitySqmJson || activitySqmJson.length < 5) {
      console.error('Insufficient data in Activity SQM sheet');
      return false;
    }
    
    // Check if the first few rows have expected columns
    const firstDataRow = activitySqmJson.find((row: any) => row['COUNTRY'] && row['CITY'] && row['REGION']);
    if (!firstDataRow) {
      console.error('Could not find a valid data row with COUNTRY, CITY, and REGION');
      return false;
    }
    
    // Check for cost columns
    if (!('LOW' in firstDataRow) || !('MEDIUM' in firstDataRow) || !('HIGH' in firstDataRow)) {
      console.error('Missing cost columns (LOW, MEDIUM, HIGH)');
      return false;
    }
    
    console.log('✅ Furniture dataset validation successful');
    return true;
  } catch (error) {
    console.error('Error validating furniture dataset:', error);
    return false;
  }
}