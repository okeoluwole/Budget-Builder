import { db } from '../db';
import { technologyCosts } from '@shared/schema';
import XLSX from 'xlsx';
import { count } from 'drizzle-orm';

interface TechnologyImportRow {
  country: string;
  city: string;
  region: string;
  activityLowSqm?: string;
  activityMediumSqm?: string;
  activityHighSqm?: string;
  activityLowSqft?: string;
  activityMediumSqft?: string;
  activityHighSqft?: string;
  teamLowSqm?: string;
  teamMediumSqm?: string;
  teamHighSqm?: string;
  teamLowSqft?: string;
  teamMediumSqft?: string;
  teamHighSqft?: string;
  eventLowSqm?: string;
  eventMediumSqm?: string;
  eventHighSqm?: string;
  eventLowSqft?: string;
  eventMediumSqft?: string;
  eventHighSqft?: string;
  locationFactorEMEA?: number;
  locationFactorAMERICA?: number;
  locationFactorAPAC?: number;
  inflationRate?: number;
}

// Helper function to convert string values to numbers, handling various formats
function convertNumberField(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal points and negative signs
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Import technology cost data from CBRE Excel file TECH sheet
 * @param filePath Path to the Excel file
 */
export async function importTechnologyCostsFromExcel(filePath: string): Promise<void> {
  try {
    console.log(`Reading CBRE TECH sheet from Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Check if TECH sheet exists
    if (!workbook.Sheets['TECH']) {
      throw new Error('TECH sheet not found in the Excel file');
    }
    
    // Convert sheet to JSON with header=false to get raw data
    const techSheet = workbook.Sheets['TECH'];
    const rawData = XLSX.utils.sheet_to_json(techSheet, { header: 1 });
    
    console.log(`Found ${rawData.length} rows in TECH sheet`);
    
    // Find header rows
    // Row 0: Main headers (TECH $/M2, TECH $/SQFT, etc.)
    // Row 2: Specification levels (Low, Medium, High)
    const headerRow = rawData[0] as any[];
    const specRow = rawData[2] as any[];
    
    console.log('Header row:', headerRow);
    console.log('Specification row:', specRow);
    
    // Parse column structure
    // Based on the CBRE TECH sheet structure:
    // Columns 4-6: Activity SQM (Low, Medium, High)
    // Columns 7-9: Team SQM (Low, Medium, High) 
    // Columns 10-12: Event SQM (Low, Medium, High)
    // Columns 14-16: Activity SQFT (Low, Medium, High)
    // Columns 17-19: Team SQFT (Low, Medium, High)
    // Columns 20-22: Event SQFT (Low, Medium, High)
    
    // Clear existing technology cost data
    await db.delete(technologyCosts);
    console.log("Cleared existing technology cost records");
    
    // Process data rows (starting from row 4, skipping headers)
    let recordsInserted = 0;
    
    for (let i = 4; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      
      // Skip empty rows
      if (!row || row.length < 3) continue;
      
      const country = row[1]?.toString().trim();
      const city = row[2]?.toString().trim();
      const region = row[3]?.toString().trim();
      
      // Skip rows without country/city data
      if (!country || !city || country === 'COUNTRY' || city === 'CITY') continue;
      
      try {
        // Extract technology costs for all layout types and specifications
        const technologyRecord = {
          country,
          city,
          region,
          
          // Activity layout technology costs (SQM)
          activityLowSqm: convertNumberField(row[4]),
          activityMediumSqm: convertNumberField(row[5]),
          activityHighSqm: convertNumberField(row[6]),
          
          // Team layout technology costs (SQM) - assuming similar structure
          teamLowSqm: convertNumberField(row[7] || row[4]), // Use activity if team not available
          teamMediumSqm: convertNumberField(row[8] || row[5]),
          teamHighSqm: convertNumberField(row[9] || row[6]),
          
          // Event layout technology costs (SQM) - assuming similar structure
          eventLowSqm: convertNumberField(row[10] || row[4]), // Use activity if event not available
          eventMediumSqm: convertNumberField(row[11] || row[5]),
          eventHighSqm: convertNumberField(row[12] || row[6]),
          
          // Activity layout technology costs (SQFT)
          activityLowSqft: convertNumberField(row[14]),
          activityMediumSqft: convertNumberField(row[15]),
          activityHighSqft: convertNumberField(row[16]),
          
          // Team layout technology costs (SQFT)
          teamLowSqft: convertNumberField(row[17] || row[14]),
          teamMediumSqft: convertNumberField(row[18] || row[15]),
          teamHighSqft: convertNumberField(row[19] || row[16]),
          
          // Event layout technology costs (SQFT)
          eventLowSqft: convertNumberField(row[20] || row[14]),
          eventMediumSqft: convertNumberField(row[21] || row[15]),
          eventHighSqft: convertNumberField(row[22] || row[16]),
          
          // Location factors and inflation (if available)
          locationFactorEMEA: 1.0, // Default value
          locationFactorAMERICA: 1.0,
          locationFactorAPAC: 1.0,
          inflationRate: convertNumberField(row[26]) || 1.0 // Last column is inflation
        };
        
        // Insert technology cost record
        await db.insert(technologyCosts).values(technologyRecord);
        recordsInserted++;
        
        // Log sample records
        if (recordsInserted <= 3 || city === 'London' || city === 'Singapore') {
          console.log(`Technology record ${recordsInserted}: ${country}/${city} - Activity Medium SQM: $${technologyRecord.activityMediumSqm}`);
        }
        
      } catch (error) {
        console.error(`Error inserting technology cost for ${country}/${city}:`, error);
        // Continue with other records even if one fails
      }
    }
    
    console.log(`Successfully imported ${recordsInserted} technology cost records`);
    
    // Verify import
    const result = await db.select({ 
      value: count() 
    }).from(technologyCosts);
    
    console.log(`Total technology cost records in database: ${result[0]?.value || 0}`);
    
  } catch (error) {
    console.error('Error importing technology costs:', error);
    throw error;
  }
}