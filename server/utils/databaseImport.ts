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
  Activity_Low_Sqm?: number;
  Activity_Medium_Sqm?: number;
  Activity_High_Sqm?: number;
  Activity_Low_Sqft?: number;
  Activity_Medium_Sqft?: number;
  Activity_High_Sqft?: number;
  Team_Low_Sqm?: number;
  Team_Medium_Sqm?: number;
  Team_High_Sqm?: number;
  Team_Low_Sqft?: number;
  Team_Medium_Sqft?: number;
  Team_High_Sqft?: number;
  Event_Low_Sqm?: number;
  Event_Medium_Sqm?: number;
  Event_High_Sqm?: number;
  Event_Low_Sqft?: number;
  Event_Medium_Sqft?: number;
  Event_High_Sqft?: number;
  Location_Factor_EMEA?: number;
  Location_Factor_AMERICA?: number;
  Location_Factor_APAC?: number;
}

/**
 * Import fit-out cost data from Excel
 * @param filePath Path to the Excel file
 */
export async function importFitoutCostsFromExcel(filePath: string): Promise<void> {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    
    // Process the data and prepare for insertion
    const fitoutCostRecords: InsertFitoutCost[] = [];
    
    // Map the Excel data to our database structure
    for (const row of data) {
      try {
        // This mapping will need to be adjusted based on the actual Excel structure
        const record: Partial<InsertFitoutCost> = {
          country: typeof row.Country === 'string' ? row.Country : 'Unknown',
          city: typeof row.City === 'string' ? row.City : 'Unknown',
          region: typeof row.Region === 'string' ? row.Region : 'Unknown',
        };
        
        // Helper function to convert Excel values to the right type
        const convertNumberField = (value: any): string | null => {
          if (value === undefined || value === null) return null;
          return value.toString();
        };
        
        // Activity layout costs
        record.activityLowSqm = convertNumberField(row.Activity_Low_Sqm);
        record.activityMediumSqm = convertNumberField(row.Activity_Medium_Sqm);
        record.activityHighSqm = convertNumberField(row.Activity_High_Sqm);
        record.activityLowSqft = convertNumberField(row.Activity_Low_Sqft);
        record.activityMediumSqft = convertNumberField(row.Activity_Medium_Sqft);
        record.activityHighSqft = convertNumberField(row.Activity_High_Sqft);
        
        // Team layout costs
        record.teamLowSqm = convertNumberField(row.Team_Low_Sqm);
        record.teamMediumSqm = convertNumberField(row.Team_Medium_Sqm);
        record.teamHighSqm = convertNumberField(row.Team_High_Sqm);
        record.teamLowSqft = convertNumberField(row.Team_Low_Sqft);
        record.teamMediumSqft = convertNumberField(row.Team_Medium_Sqft);
        record.teamHighSqft = convertNumberField(row.Team_High_Sqft);
        
        // Event layout costs
        record.eventLowSqm = convertNumberField(row.Event_Low_Sqm);
        record.eventMediumSqm = convertNumberField(row.Event_Medium_Sqm);
        record.eventHighSqm = convertNumberField(row.Event_High_Sqm);
        record.eventLowSqft = convertNumberField(row.Event_Low_Sqft);
        record.eventMediumSqft = convertNumberField(row.Event_Medium_Sqft);
        record.eventHighSqft = convertNumberField(row.Event_High_Sqft);
        
        // Location factors
        record.locationFactorEMEA = convertNumberField(row.Location_Factor_EMEA);
        record.locationFactorAMERICA = convertNumberField(row.Location_Factor_AMERICA);
        record.locationFactorAPAC = convertNumberField(row.Location_Factor_APAC);
      
      // Validate the record
      const validatedRecord = insertFitoutCostSchema.parse(record);
      fitoutCostRecords.push(validatedRecord);
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