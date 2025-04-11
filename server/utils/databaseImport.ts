import * as XLSX from 'xlsx';
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
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Debug output the first data row
    if (data.length > 0) {
      console.log("First row sample:", JSON.stringify(data[0], null, 2));
    }
    
    // Map the Excel data to our database structure
    for (const row of data) {
      try {
        // Skip rows without Country or Region
        if (!row.Country || !row.City) {
          console.log("Skipping row without Country or City:", row);
          continue;
        }
        
        // This mapping will need to be adjusted based on the actual Excel structure
        const record: Partial<InsertFitoutCost> = {
          country: String(row.Country || 'Unknown'),
          city: String(row.City || 'Unknown'),
          region: String(row.Region || 'Unknown'),
        };
        
        // Helper function to convert Excel values to the right type
        const convertNumberField = (value: any): string | null => {
          if (value === undefined || value === null) return null;
          return String(value); // Convert to string since our schema uses numeric fields as strings
        };
        
        // Map column names from the actual Excel file
        // Activity layout costs (column names may vary)
        record.activityLowSqm = convertNumberField(row["Low Specification"] || row["Low"] || row.Activity_Low_Sqm);
        record.activityMediumSqm = convertNumberField(row["Medium Specification"] || row["Medium"] || row.Activity_Medium_Sqm);
        record.activityHighSqm = convertNumberField(row["High Specification"] || row["High"] || row.Activity_High_Sqm);
        
        // Assume sqft values at 0.0929 conversion rate if not provided
        if (record.activityLowSqm) {
          const sqmValue = parseFloat(record.activityLowSqm);
          record.activityLowSqft = convertNumberField(row.Activity_Low_Sqft || (sqmValue * 0.0929));
        }
        
        if (record.activityMediumSqm) {
          const sqmValue = parseFloat(record.activityMediumSqm);
          record.activityMediumSqft = convertNumberField(row.Activity_Medium_Sqft || (sqmValue * 0.0929));
        }
        
        if (record.activityHighSqm) {
          const sqmValue = parseFloat(record.activityHighSqm);
          record.activityHighSqft = convertNumberField(row.Activity_High_Sqft || (sqmValue * 0.0929));
        }
        
        // For now, use the same values for Team and Event as for Activity if not specified
        // Team layout costs
        record.teamLowSqm = convertNumberField(row.Team_Low_Sqm || record.activityLowSqm);
        record.teamMediumSqm = convertNumberField(row.Team_Medium_Sqm || record.activityMediumSqm);
        record.teamHighSqm = convertNumberField(row.Team_High_Sqm || record.activityHighSqm);
        record.teamLowSqft = convertNumberField(row.Team_Low_Sqft || record.activityLowSqft);
        record.teamMediumSqft = convertNumberField(row.Team_Medium_Sqft || record.activityMediumSqft);
        record.teamHighSqft = convertNumberField(row.Team_High_Sqft || record.activityHighSqft);
        
        // Event layout costs
        record.eventLowSqm = convertNumberField(row.Event_Low_Sqm || record.activityLowSqm);
        record.eventMediumSqm = convertNumberField(row.Event_Medium_Sqm || record.activityMediumSqm);
        record.eventHighSqm = convertNumberField(row.Event_High_Sqm || record.activityHighSqm);
        record.eventLowSqft = convertNumberField(row.Event_Low_Sqft || record.activityLowSqft);
        record.eventMediumSqft = convertNumberField(row.Event_Medium_Sqft || record.activityMediumSqft);
        record.eventHighSqft = convertNumberField(row.Event_High_Sqft || record.activityHighSqft);
        
        // Location factors
        // Default values if not specified
        record.locationFactorEMEA = convertNumberField(row.Location_Factor_EMEA || 1.0);
        record.locationFactorAMERICA = convertNumberField(row.Location_Factor_AMERICA || 1.0);
        record.locationFactorAPAC = convertNumberField(row.Location_Factor_APAC || 1.0);
      
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