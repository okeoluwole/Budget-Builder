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
    
    // Use the "Sheet" tab which contains the data we need in a more structured format
    const sheetName = "Sheet";
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the Excel file`);
    }
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as SheetRow[];
    
    // Log the first row to see the structure
    if (data.length > 0) {
      console.log("First row from Sheet tab:", data[0]);
    }
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Map the Excel data to our database structure
    for (const row of data) {
      try {
        // Skip rows without Country, City or Region
        if (!row.COUNTRY || !row.CITY || !row.REGION) {
          console.log("Skipping row without Country, City or Region:", row);
          continue;
        }
        
        // Helper function to convert Excel values to the right type
        const convertNumberField = (value: any): string | null => {
          if (value === undefined || value === null) return null;
          // Convert to a fixed precision string to avoid overly long decimal places
          return typeof value === 'number' ? value.toFixed(2) : String(value);
        };
        
        // Create the record
        const record: Partial<InsertFitoutCost> = {
          country: String(row.COUNTRY),
          city: String(row.CITY),
          region: String(row.REGION),
          
          // Activity costs - using Low as 70% of Medium and High as in the spreadsheet
          activityLowSqm: convertNumberField((row['Activity\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7),
          activityMediumSqm: convertNumberField(row['Activity\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0),
          activityHighSqm: convertNumberField(row.__EMPTY || 0), // This is likely the high value
          
          // Team costs - using Low as 70% of Medium and High as in the spreadsheet
          teamLowSqm: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7),
          teamMediumSqm: convertNumberField(row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0),
          teamHighSqm: convertNumberField(row.__EMPTY_1 || 0), // This is likely the high value
          
          // Event costs - use Team costs multiplied by 1.2 as a reasonable approximation
          eventLowSqm: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7 * 1.2),
          eventMediumSqm: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 1.2),
          eventHighSqm: convertNumberField((row.__EMPTY_1 || 0) * 1.2),
          
          // Convert SQM to SQFT (1 sqm = 10.764 sqft)
          activityLowSqft: convertNumberField((row['Activity\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7 / 10.764),
          activityMediumSqft: convertNumberField((row['Activity\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) / 10.764),
          activityHighSqft: convertNumberField((row.__EMPTY || 0) / 10.764),
          
          teamLowSqft: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7 / 10.764),
          teamMediumSqft: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) / 10.764),
          teamHighSqft: convertNumberField((row.__EMPTY_1 || 0) / 10.764),
          
          eventLowSqft: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 0.7 * 1.2 / 10.764),
          eventMediumSqft: convertNumberField((row['Team\r\nFIT-OUT TOTAL\r\n$ per sq m'] || 0) * 1.2 / 10.764),
          eventHighSqft: convertNumberField((row.__EMPTY_1 || 0) * 1.2 / 10.764),
          
          // Location factors - we have several columns in the data
          locationFactorEMEA: convertNumberField(row['LF - London'] || 1.0), // Using London as EMEA reference
          locationFactorAMERICA: convertNumberField(row['LF-New York'] || 1.0), // Using New York as AMERICA reference
          locationFactorAPAC: convertNumberField(row['LF - Singapore'] || 1.0), // Using Singapore as APAC reference
        };
        
        // Validate the record
        const validatedRecord = insertFitoutCostSchema.parse(record);
        fitoutCostRecords.push(validatedRecord);
      } catch (error) {
        console.error('Error processing row:', row, error);
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