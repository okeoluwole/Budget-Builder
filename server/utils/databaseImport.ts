import XLSX from 'xlsx';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { db } from '../db';
import { 
  fitoutCosts, insertFitoutCostSchema, InsertFitoutCost,
  specifications, InsertSpecification,
  layoutTemplates, InsertLayoutTemplate,
  budgetTemplates, InsertBudgetTemplate
} from '@shared/schema';
import { importCurrencyRatesFromJson } from './currencyImport';

// Type definition for the "Sheet" tab in Excel which has the most structured data
interface SheetRow {
  COUNTRY?: string;
  CITY?: string;
  REGION?: string;
  'Activity\r\nFIT-OUT TOTAL\r\n$ per sq m'?: number;
  __EMPTY?: number; // This appears to be High specification for Activity
  'Team\r\nFIT-OUT TOTAL\r\n$ per sq m'?: number;
  __EMPTY_1?: number; // This appears to be High specification for Team
  'LF - London'?: number;
  'LF - Singapore'?: number;
  'LF - Mexico'?: number;
  'LF-New York'?: number;
}

/**
 * Import fit-out cost data from Excel
 * @param filePath Path to the Excel file
 */
export async function importFitoutCostsFromExcel(filePath: string): Promise<void> {
  try {
    console.log("Reading Excel file:", filePath);
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Let's log available sheets for debugging
    console.log("Available sheets:", workbook.SheetNames);
    
    // Use the dedicated tables for each layout type
    const activitySqmSheetName = "Table 1_Activity BYOB Sqm";
    const activitySqftSheetName = "Table 1_Activity BYOB SqFt";
    const teamSqmSheetName = "Table 2_Team BYOB Sqm";
    const teamSqftSheetName = "Table 2_Team BYOB SqFt";
    const eventSqmSheetName = "Table 3_Event BYOB Sqm";
    const eventSqftSheetName = "Table 3_Event BYOB SqFt";
    
    // Check if all required sheets exist
    if (!workbook.Sheets[activitySqmSheetName]) {
      throw new Error(`Sheet "${activitySqmSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[teamSqmSheetName]) {
      throw new Error(`Sheet "${teamSqmSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[eventSqmSheetName]) {
      throw new Error(`Sheet "${eventSqmSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[activitySqftSheetName]) {
      throw new Error(`Sheet "${activitySqftSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[teamSqftSheetName]) {
      throw new Error(`Sheet "${teamSqftSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[eventSqftSheetName]) {
      throw new Error(`Sheet "${eventSqftSheetName}" not found in the Excel file`);
    }
    
    // Define a helper function to read each sheet with proper headers
    const readSheetData = (sheetName: string) => {
      // The actual header is at row 5 (index 4)
      const worksheet = workbook.Sheets[sheetName];
      
      // Using the column indices directly is more reliable in this case
      // since the header row in the Excel file is causing issues
      return XLSX.utils.sheet_to_json(worksheet, { 
        range: 5, // Start reading from row 6 (index 5), which is the first data row
        header: ["COUNTRY", "CITY", "REGION", "LOW", "MEDIUM", "HIGH", 
                "UNUSED1", "FURN_LOW", "FURN_MEDIUM", "FURN_HIGH", 
                "UNUSED2", "TECH_LOW", "TECH_MEDIUM", "TECH_HIGH", 
                "UNUSED3", "TOTAL"]
      });
    };
    
    // Read data from each sheet
    const activitySqmData = readSheetData(activitySqmSheetName);
    const activitySqftData = readSheetData(activitySqftSheetName);
    const teamSqmData = readSheetData(teamSqmSheetName);
    const teamSqftData = readSheetData(teamSqftSheetName);
    const eventSqmData = readSheetData(eventSqmSheetName);
    const eventSqftData = readSheetData(eventSqftSheetName);
    
    // Log the first row from activity sheet to see the structure
    if (activitySqmData.length > 0) {
      console.log("First row from Activity SQM sheet:", activitySqmData[1]); // Index 1 because index 0 might still be header-related
    }
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Helper function to convert Excel values to the right type
    const convertNumberField = (value: any): string | null => {
      if (value === undefined || value === null) return null;
      // Convert to a fixed precision string to avoid overly long decimal places
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    };
    
    // Define a helper function to find matching rows in other sheets by country/city
    const findMatchingRow = (data: any[], country: string, city: string) => {
      return (data as any[]).find(
        (row: any) => 
          row['COUNTRY'] === country && 
          row['CITY'] === city
      ) || {};
    };
    
    // Define our reference city costs
    // These will be used to calculate location factors
    let londonMedium: number | null = null;
    let newyorkMedium: number | null = null;
    let singaporeMedium: number | null = null;
    
    // First, find the benchmark cities in the data
    for (let i = 0; i < activitySqmData.length; i++) {
      const row = activitySqmData[i] as any;
      
      if (row['COUNTRY'] === 'United Kingdom' && row['CITY'] === 'London') {
        londonMedium = Number(row['MEDIUM'] || 0);
        console.log(`Found London benchmark: ${londonMedium}`);
      }
      
      if (row['COUNTRY'] === 'United States' && row['CITY'] === 'New York') {
        newyorkMedium = Number(row['MEDIUM'] || 0);
        console.log(`Found New York benchmark: ${newyorkMedium}`);
      }
      
      if (row['COUNTRY'] === 'Singapore' && row['CITY'] === 'Singapore') {
        singaporeMedium = Number(row['MEDIUM'] || 0);
        console.log(`Found Singapore benchmark: ${singaporeMedium}`);
      }
    }
    
    // Set defaults if any benchmark city wasn't found
    if (!londonMedium) {
      londonMedium = 2132.88; // Default from previous data
      console.log(`Using default London benchmark: ${londonMedium}`);
    }
    
    if (!newyorkMedium) {
      newyorkMedium = 3662.39; // Default from previous data
      console.log(`Using default New York benchmark: ${newyorkMedium}`);
    }
    
    if (!singaporeMedium) {
      singaporeMedium = 2200.45; // Default from previous data
      console.log(`Using default Singapore benchmark: ${singaporeMedium}`);
    }
    
    // Map over the Activity data which will be our primary source
    // We'll match Team and Event data by country/city
    for (let i = 0; i < activitySqmData.length; i++) {
      try {
        const activitySqmRow = activitySqmData[i] as any;
        
        // Skip rows without Country, City or Region
        if (!activitySqmRow['COUNTRY'] || !activitySqmRow['CITY'] || !activitySqmRow['REGION']) {
          console.log("Skipping row without Country, City or Region:", activitySqmRow);
          continue;
        }
        
        const country = String(activitySqmRow['COUNTRY']);
        const city = String(activitySqmRow['CITY']);
        const region = String(activitySqmRow['REGION']);
        
        // Find matching rows in other sheets
        const activitySqftRow = findMatchingRow(activitySqftData as any[], country, city);
        const teamSqmRow = findMatchingRow(teamSqmData as any[], country, city);
        const teamSqftRow = findMatchingRow(teamSqftData as any[], country, city);
        const eventSqmRow = findMatchingRow(eventSqmData as any[], country, city);
        const eventSqftRow = findMatchingRow(eventSqftData as any[], country, city);
        
        // Get professional fees percentage from the TOTAL column (should be 0.X decimal)
        const profFeePercentage = Number(activitySqmRow['TOTAL'] || 0.15); // Default to 15% if not available
        
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
        
        // Create the record with validated data
        const record: Partial<InsertFitoutCost> = {
          country,
          city,
          region,
          
          // Activity costs from Table 1 SQM
          activityLowSqm: convertNumberField(activitySqmRow['LOW'] || 0),
          activityMediumSqm: convertNumberField(activitySqmRow['MEDIUM'] || 0),
          activityHighSqm: convertNumberField(activitySqmRow['HIGH'] || 0),
          
          // Team costs from Table 2 SQM
          teamLowSqm: convertNumberField(teamSqmRow['LOW'] || 0),
          teamMediumSqm: convertNumberField(teamSqmRow['MEDIUM'] || 0),
          teamHighSqm: convertNumberField(teamSqmRow['HIGH'] || 0),
          
          // Event costs from Table 3 SQM
          eventLowSqm: convertNumberField(eventSqmRow['LOW'] || 0),
          eventMediumSqm: convertNumberField(eventSqmRow['MEDIUM'] || 0),
          eventHighSqm: convertNumberField(eventSqmRow['HIGH'] || 0),
          
          // SQFT values from corresponding SQFT tables
          // Activity
          activityLowSqft: convertNumberField(activitySqftRow['LOW'] || 0),
          activityMediumSqft: convertNumberField(activitySqftRow['MEDIUM'] || 0),
          activityHighSqft: convertNumberField(activitySqftRow['HIGH'] || 0),
          
          // Team
          teamLowSqft: convertNumberField(teamSqftRow['LOW'] || 0),
          teamMediumSqft: convertNumberField(teamSqftRow['MEDIUM'] || 0),
          teamHighSqft: convertNumberField(teamSqftRow['HIGH'] || 0),
          
          // Event
          eventLowSqft: convertNumberField(eventSqftRow['LOW'] || 0),
          eventMediumSqft: convertNumberField(eventSqftRow['MEDIUM'] || 0),
          eventHighSqft: convertNumberField(eventSqftRow['HIGH'] || 0),
          
          // Location factors calculated based on benchmarks
          locationFactorEMEA: convertNumberField(locationFactorEMEA),
          locationFactorAMERICA: convertNumberField(locationFactorAMERICA),
          locationFactorAPAC: convertNumberField(locationFactorAPAC),
          
          // Professional fees
          professionalFees: convertNumberField(profFeePercentage)
        };
        
        // Log the first few records for debugging
        if (i < 3) {
          console.log(`Record for ${country}/${city}: Region=${region}, Activity Medium=${record.activityMediumSqm}`);
          console.log(`Location factors: EMEA=${record.locationFactorEMEA}, AMERICA=${record.locationFactorAMERICA}, APAC=${record.locationFactorAPAC}`);
        }
        
        // Validate the record
        const validatedRecord = insertFitoutCostSchema.parse(record);
        fitoutCostRecords.push(validatedRecord);
      } catch (error) {
        console.error('Error processing row from Activity sheet:', activitySqmData[i], error);
      }
    }
    
    // Insert into database
    if (fitoutCostRecords.length > 0) {
      // Clear existing data first
      await db.delete(fitoutCosts);
      console.log("Cleared existing fit-out cost records");
      
      // Now insert new data
      await db.insert(fitoutCosts).values(fitoutCostRecords);
      console.log(`Imported ${fitoutCostRecords.length} fit-out cost records`);
    } else {
      console.log('No fit-out cost records to import');
    }
  } catch (error) {
    console.error('Error importing fit-out costs from Excel:', error);
    // Enhanced error with more context
    if (error instanceof Error) {
      const enhancedError = new Error(`Failed to import fit-out costs: ${error.message}`);
      enhancedError.stack = error.stack;
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Import specifications from JSON file
 * @param filePath Path to the JSON file
 */
export async function importSpecificationsToDb(filePath: string): Promise<void> {
  try {
    // Read and process the JSON data
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    // Map the JSON data to our database structure
    const specRecords: InsertSpecification[] = data.map((spec: any) => ({
      name: spec.name,
      description: spec.description,
      walls: spec.walls,
      partitionType: spec.partitions.type,
      partitionAcousticRating: spec.partitions.acousticRating,
      partitionCostFactor: spec.partitions.costFactor,
      flooring: spec.flooring,
      ceiling: spec.ceiling,
      furnitureDesks: spec.furniture.desks,
      furnitureChairs: spec.furniture.chairs,
      furnitureStorage: spec.furniture.storage,
      technologyAV: spec.technology.av,
      technologySecurity: spec.technology.security,
      fittings: spec.fittings,
      recommendedFor: spec.recommendedFor
    }));
    
    // Insert into database
    if (specRecords.length > 0) {
      await db.insert(specifications).values(specRecords);
      console.log(`Imported ${specRecords.length} specification records`);
    } else {
      console.log('No specification records to import');
    }
  } catch (error) {
    console.error('Error importing specifications to database:', error);
    throw error;
  }
}

/**
 * Import layout templates from JSON file
 * @param filePath Path to the JSON file
 */
export async function importLayoutTemplatesToDb(filePath: string): Promise<void> {
  try {
    // Read and process the JSON data
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    // Map the JSON data to our database structure
    const layoutRecords: InsertLayoutTemplate[] = data.map((layout: any) => ({
      name: layout.name,
      description: layout.description,
      benefits: JSON.stringify(layout.benefits),
      defaultAllocation: layout.spaceTypes
    }));
    
    // Insert into database
    if (layoutRecords.length > 0) {
      await db.insert(layoutTemplates).values(layoutRecords);
      console.log(`Imported ${layoutRecords.length} layout template records`);
    } else {
      console.log('No layout template records to import');
    }
  } catch (error) {
    console.error('Error importing layout templates to database:', error);
    throw error;
  }
}

/**
 * Import budget template structure from JSON file
 * @param filePath Path to the JSON file
 */
export async function importBudgetTemplateToDb(filePath: string): Promise<void> {
  try {
    // Read and process the JSON data
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    // Create a record for our database
    const templateRecord: InsertBudgetTemplate = {
      name: 'Standard Fit-out Budget Template',
      description: 'Default template for fit-out budgeting',
      structure: data
    };
    
    // Insert into database
    await db.insert(budgetTemplates).values(templateRecord);
    console.log('Imported budget template structure');
  } catch (error) {
    console.error('Error importing budget template to database:', error);
    throw error;
  }
}

/**
 * Initialize the database with all required reference data
 */
export async function initializeDatabase(): Promise<void> {
  const dataDir = join(process.cwd(), 'data');
  
  // Import specifications
  const specificationsPath = join(dataDir, 'specifications.json');
  await importSpecificationsToDb(specificationsPath);
  
  // Import layout templates
  const layoutTemplatesPath = join(dataDir, 'layout_templates.json');
  await importLayoutTemplatesToDb(layoutTemplatesPath);
  
  // Import budget template structure
  const budgetTemplatePath = join(dataDir, 'budget_template_structure.json');
  await importBudgetTemplateToDb(budgetTemplatePath);
  
  // Import currency rates from our JSON file with 2025 FX rates
  await importCurrencyRatesFromJson();
  
  // Import fitout costs from the clean redacted Excel file
  try {
    const excelPath = join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Redacted.xlsx');
    if (existsSync(excelPath)) {
      await importFitoutCostsFromExcel(excelPath);
    } else {
      console.log('Fitout costs Excel file not found at path:', excelPath);
    }
  } catch (error) {
    console.error('Error importing fitout costs from Excel during initialization:', error);
    // Continue with other initialization steps even if this fails
  }
  
  console.log('Database initialization complete');
}