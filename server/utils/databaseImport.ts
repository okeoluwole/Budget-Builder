import XLSX from 'xlsx';
import { join } from 'path';
import { db } from '../db';
import { 
  fitoutCosts, insertFitoutCostSchema, InsertFitoutCost,
  specifications, InsertSpecification,
  layoutTemplates, InsertLayoutTemplate,
  budgetTemplates, InsertBudgetTemplate
} from '@shared/schema';

// Type definition for Excel row data
interface ExcelRow {
  Country?: string;
  City?: string;
  Region?: string;
  Activity_Low_Sqm?: number | string;
  Activity_Medium_Sqm?: number | string;
  Activity_High_Sqm?: number | string;
  Activity_Low_Sqft?: number | string;
  Activity_Medium_Sqft?: number | string;
  Activity_High_Sqft?: number | string;
  Team_Low_Sqm?: number | string;
  Team_Medium_Sqm?: number | string;
  Team_High_Sqm?: number | string;
  Team_Low_Sqft?: number | string;
  Team_Medium_Sqft?: number | string;
  Team_High_Sqft?: number | string;
  Event_Low_Sqm?: number | string;
  Event_Medium_Sqm?: number | string;
  Event_High_Sqm?: number | string;
  Event_Low_Sqft?: number | string;
  Event_Medium_Sqft?: number | string;
  Event_High_Sqft?: number | string;
  Location_Factor_EMEA?: number | string;
  Location_Factor_AMERICA?: number | string;
  Location_Factor_APAC?: number | string;
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
    
    // Use the FITOUT sheet instead of the first one
    const sheetName = "FITOUT"; 
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON, starting from row 4 which has the data
    // Note: Excel is 1-based but ranges are 0-based
    const data = XLSX.utils.sheet_to_json(worksheet, {
      range: 'A4:V100' // Range A4:V100 should cover all the data
    }) as Record<string, any>[];
    
    // Log the first row to see the structure
    if (data.length > 0) {
      console.log("First row structure:", Object.keys(data[0]));
    }
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Debug output the first data row
    if (data.length > 0) {
      console.log("First row sample:", JSON.stringify(data[0], null, 2));
    }
    
    // Map the Excel data to our database structure
    for (const row of data) {
      try {
        // Based on the Excel structure, we need to map using __EMPTY_1, __EMPTY_2, etc.
        if (!row.__EMPTY_1 || !row.__EMPTY_2) {
          console.log("Skipping row without Country or City:", row);
          continue;
        }
        
        // This mapping will need to be adjusted based on the actual Excel structure
        const record: Partial<InsertFitoutCost> = {
          country: String(row.__EMPTY_1 || 'Unknown'),
          city: String(row.__EMPTY_2 || 'Unknown'),
          region: String(row.__EMPTY_3 || 'Unknown'),
        };
        
        // Helper function to convert Excel values to the right type
        const convertNumberField = (value: any): string | null => {
          if (value === undefined || value === null) return null;
          return String(value); // Convert to string since our schema uses numeric fields as strings
        };
        
        // Based on the Excel file structure we observed
        // The column names are like: " Low ", "Medium ", "High ", etc.
        
        // Activity layout costs (first set of 3 columns - SQM)
        record.activityLowSqm = convertNumberField(row[" Low "]); 
        record.activityMediumSqm = convertNumberField(row["Medium "]);
        record.activityHighSqm = convertNumberField(row["High "]);
        
        // Team layout costs (second set of 3 columns - SQM)
        record.teamLowSqm = convertNumberField(row["Low"]);
        record.teamMediumSqm = convertNumberField(row["Medium _1"]);
        record.teamHighSqm = convertNumberField(row["High"]);
        
        // Event layout costs (third set of 3 columns - SQM)
        record.eventLowSqm = convertNumberField(row["Low "]);
        record.eventMediumSqm = convertNumberField(row["Medium _2"]);
        record.eventHighSqm = convertNumberField(row["High _1"]);
        
        // Activity layout costs (first set of 3 columns - SQFT)
        record.activityLowSqft = convertNumberField(row[" Low _1"]);
        record.activityMediumSqft = convertNumberField(row["Medium _3"]);
        record.activityHighSqft = convertNumberField(row["High _2"]);
        
        // Team layout costs (second set of 3 columns - SQFT)
        record.teamLowSqft = convertNumberField(row["Low_1"]);
        record.teamMediumSqft = convertNumberField(row["Medium _4"]);
        record.teamHighSqft = convertNumberField(row["High_1"]);
        
        // Event layout costs (third set of 3 columns - SQFT)
        record.eventLowSqft = convertNumberField(row["Low _1"]);
        record.eventMediumSqft = convertNumberField(row["Medium _5"]);
        record.eventHighSqft = convertNumberField(row["High _3"]);
        
        // Location factors - last 3 columns with location factors
        // The only labeled one seems to be " 213.87 " (which looks like EMEA)
        // We might need to hardcode some values based on position
        record.locationFactorEMEA = convertNumberField(row[" 213.87 "]);
        
        // These might need adjustment after checking the Excel file more closely
        // For now we'll use default values
        record.locationFactorAMERICA = convertNumberField(1.0);
        record.locationFactorAPAC = convertNumberField(0.8);
      
        // Validate the record
        const validatedRecord = insertFitoutCostSchema.parse(record);
        fitoutCostRecords.push(validatedRecord);
      } catch (error) {
        console.error('Error processing row:', row, error);
      }
    }
    
    // Insert into database
    if (fitoutCostRecords.length > 0) {
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
    const data = require(filePath);
    
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
    const data = require(filePath);
    
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
    const data = require(filePath);
    
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
  
  // Fitout costs would be imported from Excel when available
  console.log('Database initialization complete');
}