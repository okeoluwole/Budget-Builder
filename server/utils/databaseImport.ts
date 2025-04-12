import XLSX from 'xlsx';
import { join } from 'path';
import { readFileSync } from 'fs';
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
    const activitySheetName = "Table 1_Activity BYOB Sqm";
    const teamSheetName = "Table 2_Team BYOB Sqm";
    const eventSheetName = "Table 3_Event BYOB Sqm";
    
    // Check if all required sheets exist
    if (!workbook.Sheets[activitySheetName]) {
      throw new Error(`Sheet "${activitySheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[teamSheetName]) {
      throw new Error(`Sheet "${teamSheetName}" not found in the Excel file`);
    }
    if (!workbook.Sheets[eventSheetName]) {
      throw new Error(`Sheet "${eventSheetName}" not found in the Excel file`);
    }
    
    // Define a helper function to read each sheet with proper headers
    const readSheetData = (sheetName: string) => {
      // Read with header row at line 4 (index 3)
      const opts = { header: 4 }; 
      const worksheet = workbook.Sheets[sheetName];
      // Convert to JSON
      return XLSX.utils.sheet_to_json(worksheet, opts);
    };
    
    // Read data from each sheet
    const activityData = readSheetData(activitySheetName);
    const teamData = readSheetData(teamSheetName);
    const eventData = readSheetData(eventSheetName);
    
    // Log the first row of each sheet to see the structure
    if (activityData.length > 0) {
      console.log("First row from Activity sheet:", activityData[1]); // Index 1 because index 0 might still be header-related
    }
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Helper function to convert Excel values to the right type
    const convertNumberField = (value: any): string | null => {
      if (value === undefined || value === null) return null;
      // Convert to a fixed precision string to avoid overly long decimal places
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    };
    
    // Map over the Activity data which will be our primary source
    // We'll match Team and Event data by country/city
    for (let i = 1; i < activityData.length; i++) { // Start at index 1 to skip any header rows
      try {
        const activityRow = activityData[i] as any;
        
        // Skip rows without Country, City or Region
        if (!activityRow['Unnamed: 1'] || !activityRow['Unnamed: 2'] || !activityRow['Unnamed: 3']) {
          console.log("Skipping row without Country, City or Region:", activityRow);
          continue;
        }
        
        const country = String(activityRow['Unnamed: 1']);
        const city = String(activityRow['Unnamed: 2']);
        const region = String(activityRow['Unnamed: 3']);
        
        // Find matching rows in Team and Event data
        const teamRow = (teamData as any[]).find(
          (row: any) => 
            row['Unnamed: 1'] === country && 
            row['Unnamed: 2'] === city
        ) || {};
        
        const eventRow = (eventData as any[]).find(
          (row: any) => 
            row['Unnamed: 1'] === country && 
            row['Unnamed: 2'] === city
        ) || {};
        
        // Create the record with validated data
        const record: Partial<InsertFitoutCost> = {
          country,
          city,
          region,
          
          // Activity costs from Table 1
          activityLowSqm: convertNumberField(activityRow['Low'] || 0),
          activityMediumSqm: convertNumberField(activityRow['Medium '] || 0),
          activityHighSqm: convertNumberField(activityRow['High '] || 0),
          
          // Team costs from Table 2
          teamLowSqm: convertNumberField(teamRow['Low'] || 0),
          teamMediumSqm: convertNumberField(teamRow['Medium '] || 0),
          teamHighSqm: convertNumberField(teamRow['High '] || 0),
          
          // Event costs from Table 3
          eventLowSqm: convertNumberField(eventRow['Low'] || 0),
          eventMediumSqm: convertNumberField(eventRow['Medium '] || 0),
          eventHighSqm: convertNumberField(eventRow['High '] || 0),
          
          // Convert sqm to sqft (these are already in SQFT in the spreadsheet)
          // Activity
          activityLowSqft: convertNumberField((activityRow['Low.1'] || 0)),
          activityMediumSqft: convertNumberField((activityRow['Medium .1'] || 0)),
          activityHighSqft: convertNumberField((activityRow['High .1'] || 0)),
          
          // Team
          teamLowSqft: convertNumberField((teamRow['Low.1'] || 0)),
          teamMediumSqft: convertNumberField((teamRow['Medium .1'] || 0)),
          teamHighSqft: convertNumberField((teamRow['High .1'] || 0)),
          
          // Event
          eventLowSqft: convertNumberField((eventRow['Low.1'] || 0)),
          eventMediumSqft: convertNumberField((eventRow['Medium .1'] || 0)),
          eventHighSqft: convertNumberField((eventRow['High .1'] || 0)),
          
          // Location factors - For now using position 17, 18, 19 in the activityRow which typically contain LF values
          // These positions may need adjustment based on actual data inspection
          locationFactorEMEA: convertNumberField(activityRow['High .2'] || 1.0), // This should be around column 17
          locationFactorAMERICA: convertNumberField(activityRow['Low.2'] || 1.0), // This should be around column 18
          locationFactorAPAC: convertNumberField(activityRow['Medium .2'] || 1.0), // This should be around column 19
        };
        
        // Log the location factors for debugging
        console.log(`Location factors for ${country}/${city}: EMEA=${record.locationFactorEMEA}, AMERICA=${record.locationFactorAMERICA}, APAC=${record.locationFactorAPAC}`);
        
        // Validate the record
        const validatedRecord = insertFitoutCostSchema.parse(record);
        fitoutCostRecords.push(validatedRecord);
      } catch (error) {
        console.error('Error processing row from Activity sheet:', activityData[i], error);
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
  
  // Fitout costs would be imported from Excel when available
  console.log('Database initialization complete');
}