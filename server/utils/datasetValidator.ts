import fs from 'fs';
import path from 'path';
import { parseExcelFile, sheetToJson } from './excelReader';

interface DatasetValidationResult {
  isValid: boolean;
  datasetName: string;
  issues: string[];
  timestamp: Date;
}

/**
 * Validates that the correct furniture dataset file is being used
 * @param datasetPath The path to the furniture dataset file
 * @returns Validation result object
 */
export async function validateFurnitureDataset(datasetPath: string = 'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx'): Promise<DatasetValidationResult> {
  const result: DatasetValidationResult = {
    isValid: true,
    datasetName: path.basename(datasetPath),
    issues: [],
    timestamp: new Date()
  };
  
  try {
    // Check if file exists
    if (!fs.existsSync(datasetPath)) {
      result.isValid = false;
      result.issues.push(`Furniture dataset file not found: ${datasetPath}`);
      return result;
    }
    
    // Check filename pattern
    const filename = path.basename(datasetPath);
    if (!filename.includes('Furniture')) {
      result.isValid = false;
      result.issues.push(`Furniture dataset filename should contain 'Furniture': ${filename}`);
    }
    
    // Parse Excel file
    const xlsx = await parseExcelFile(datasetPath);
    
    // Check required sheets
    const requiredSheets = [
      'Table 1_Activity BYOB Sqm',
      'Table 1_Activity BYOB SqFt',
      'Table 2_Team BYOB Sqm',
      'Table 2_Team BYOB SqFt',
      'Table 3_Event BYOB Sqm',
      'Table 3_Event BYOB SqFt'
    ];
    
    // Show sheets for debugging
    console.log(`Available sheets in furniture dataset:`, xlsx.SheetNames);
    
    // Check all required sheets exist
    for (const sheet of requiredSheets) {
      if (!xlsx.SheetNames.includes(sheet)) {
        result.isValid = false;
        result.issues.push(`Required sheet missing in furniture dataset: ${sheet}`);
      }
    }
    
    // Check a sample of each sheet
    for (const sheet of xlsx.SheetNames) {
      if (requiredSheets.includes(sheet)) {
        const sheetData = xlsx.Sheets[sheet];
        const jsonData = sheetToJson(sheetData);
        
        // Log sample data
        console.log(`First row of sheet ${sheet}:`, jsonData[0]);
        
        // Check for expected identifiers in first row
        const firstRow = jsonData[0];
        if (sheet.includes('Table 1_Activity') && !firstRow['ACTIVITY SPACE']) {
          result.isValid = false;
          result.issues.push(`Missing 'ACTIVITY SPACE' header in ${sheet}`);
        } else if (sheet.includes('Table 2_Team') && !firstRow['TEAM SPACE']) {
          result.isValid = false;
          result.issues.push(`Missing 'TEAM SPACE' header in ${sheet}`);
        } else if (sheet.includes('Table 3_Event') && !firstRow['EVENT SPACE']) {
          result.isValid = false;
          result.issues.push(`Missing 'EVENT SPACE' header in ${sheet}`);
        }
        
        // Check if the headers indicate furniture data
        const firstCell = Object.values(firstRow)[0];
        if (typeof firstCell === 'string' && !firstCell.includes('FURNITURE')) {
          result.isValid = false;
          result.issues.push(`Sheet ${sheet} appears to be for fitout, not furniture data`);
        }
      }
    }
    
    // Check for at least some data rows in a couple of sheets
    const activitySqmData = sheetToJson(xlsx.Sheets['Table 1_Activity BYOB Sqm']);
    if (activitySqmData.length < 5) {
      result.isValid = false;
      result.issues.push('Insufficient data rows in Activity SQM sheet');
    }
    
    const teamSqmData = sheetToJson(xlsx.Sheets['Table 2_Team BYOB Sqm']);
    if (teamSqmData.length < 5) {
      result.isValid = false;
      result.issues.push('Insufficient data rows in Team SQM sheet');
    }
    
    if (result.isValid) {
      console.log(`✅ Furniture dataset validation successful: ${result.datasetName}`);
    } else {
      console.log(`❌ Furniture dataset validation failed: ${result.datasetName}`);
      result.issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    return result;
  } catch (error: unknown) {
    result.isValid = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.issues.push(`Error validating furniture dataset: ${errorMessage}`);
    console.error('Error validating furniture dataset:', error);
    return result;
  }
}

/**
 * Validates that the correct dataset file is being used with multiple checks
 * @param datasetPath The path to the dataset file
 * @returns Validation result object
 */
export async function validateDataset(datasetPath: string = 'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx'): Promise<DatasetValidationResult> {
  const result: DatasetValidationResult = {
    isValid: false,
    datasetName: path.basename(datasetPath),
    issues: [],
    timestamp: new Date()
  };
  
  try {
    // Check 1: File existence
    if (!fs.existsSync(datasetPath)) {
      result.issues.push(`Dataset file not found: ${datasetPath}`);
      return result;
    }

    // Check 2: File name validation
    const expectedFileName = 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx';
    if (path.basename(datasetPath) !== expectedFileName) {
      result.issues.push(`Incorrect dataset file name: expected "${expectedFileName}", found "${path.basename(datasetPath)}"`);
    }

    // Check 3: Parse and validate Excel file structure and content
    try {
      const excelData = await parseExcelFile(datasetPath);
      
      // Define patterns for required sheets with more flexible matching
      const requiredSheetPatterns = [
        // Activity sheets - multiple possible naming conventions
        [
          'Table 1_Activity BYOB Sqm', 
          'Table 1_Activity BYOB SQM', 
          'Table 1_Activity Sqm',
          'Activity BYOB Sqm',
          'Activity Sqm'
        ],
        // Team sheets - multiple possible naming conventions
        [
          'Table 2_Team BYOB Sqm', 
          'Table 2_Team BYOB SQM',
          'Table 2_Team Sqm', 
          'Team BYOB Sqm',
          'Team Sqm'
        ],
        // Event sheets - multiple possible naming conventions
        [
          'Table 3_Event BYOB Sqm', 
          'Table 3_Event BYOB SQM', 
          'Table 3_Event Sqm',
          'Event BYOB Sqm',
          'Event Sqm'
        ]
      ];
      
      // Get actual sheet names from the Excel file
      const sheetNames = excelData.SheetNames || [];
      console.log('Available sheets:', sheetNames);
      
      // For each required sheet pattern group, check if at least one pattern matches
      const missingSheetTypes = [];
      for (let i = 0; i < requiredSheetPatterns.length; i++) {
        const patternGroup = requiredSheetPatterns[i];
        const sheetType = i === 0 ? 'Activity' : i === 1 ? 'Team' : 'Event';
        
        // Check if any pattern in this group matches an existing sheet
        const foundMatch = patternGroup.some(pattern => 
          sheetNames.some(sheetName => 
            sheetName.includes(pattern) || 
            // Also check for case insensitive matches
            sheetName.toLowerCase().includes(pattern.toLowerCase())
          )
        );
        
        if (!foundMatch) {
          missingSheetTypes.push(sheetType);
          result.issues.push(`Could not find any "${sheetType}" sheet in dataset.`);
        }
      }
      
      // If we're missing any sheet types, provide a more helpful error message
      if (missingSheetTypes.length > 0) {
        result.issues.push(
          `Expected sheets for: ${missingSheetTypes.join(', ')}. Found sheets: ${sheetNames.join(', ')}`
        );
      }
      
      // Sample data validation for available sheets 
      for (const sheetName of sheetNames) {
        // Check if this is a relevant sheet we want to validate
        const isActivitySheet = sheetName.toLowerCase().includes('activity');
        const isTeamSheet = sheetName.toLowerCase().includes('team');
        const isEventSheet = sheetName.toLowerCase().includes('event');
        
        if (isActivitySheet || isTeamSheet || isEventSheet) {
          const sheetData = sheetToJson(excelData.Sheets[sheetName]);
          
          // Check that sheet has at least some rows
          if (!Array.isArray(sheetData) || sheetData.length < 5) {
            result.issues.push(`Sheet "${sheetName}" has insufficient data rows (${sheetData?.length || 0})`);
            continue;
          }
          
          // Check for expected structure based on CBRE_Fit Out Guide Cost Data_Fitout Only.xlsx
          const firstRow = sheetData[0];
          
          // Different required columns based on sheet type
          let requiredColumn = '';
          if (sheetName.includes('Activity')) {
            requiredColumn = 'ACTIVITY SPACE';
          } else if (sheetName.includes('Team')) {
            requiredColumn = 'TEAM SPACE';
          } else if (sheetName.includes('Event')) {
            requiredColumn = 'EVENT SPACE';
          }
          
          if (requiredColumn && !firstRow.hasOwnProperty(requiredColumn)) {
            result.issues.push(`Sheet "${sheetName}" is missing required column "${requiredColumn}"`);
          }
          
          // Check for expected format indicator - FIT OUT price in the header
          let hasFitOutIndicator = false;
          
          // Examine object values for expected strings
          Object.values(firstRow).forEach(value => {
            if (typeof value === 'string' && 
                (value.includes('FIT OUT $/M2') || 
                 value.includes('FIT OUT $/SqFt'))) {
              hasFitOutIndicator = true;
            }
          });
          
          if (!hasFitOutIndicator) {
            result.issues.push(`Sheet "${sheetName}" is missing expected fit-out cost indicator in header`);
          }
        }
      }
      
      // Additional checks for specific constants/values that identify this as the correct dataset
      // For example, check if specific benchmark values are present
      
      // Additional verification by checking some expected sheet content patterns
      // Find an activity sheet to check for benchmark locations
      const activitySheet = sheetNames.find(name => 
        name.toLowerCase().includes('activity') && 
        name.toLowerCase().includes('sqm')
      );
      
      if (activitySheet) {
        const activityData = sheetToJson(excelData.Sheets[activitySheet]);
        
        // Check for common indicators that this is the correct file - expected regions or areas
        let foundLondonIndicator = false;
        let foundNewYorkIndicator = false;
        
        for (const row of activityData) {
          // Check all fields for common indicators
          const allValues = Object.values(row).map(val => 
            typeof val === 'string' ? val.toLowerCase() : String(val).toLowerCase()
          ).join(' ');
          
          if (allValues.includes('london')) {
            foundLondonIndicator = true;
          }
          
          if (allValues.includes('new york')) {
            foundNewYorkIndicator = true;
          }
          
          // If both indicators found, break early
          if (foundLondonIndicator && foundNewYorkIndicator) {
            break;
          }
        }
        
        // If specific benchmarks are not found, flag as potential wrong dataset
        if (!foundLondonIndicator) {
          result.issues.push('Expected benchmark data for London not found in Activity sheet');
        }
        
        if (!foundNewYorkIndicator) {
          result.issues.push('Expected benchmark data for New York not found in Activity sheet');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.issues.push(`Error parsing Excel file: ${errorMessage || 'Unknown error'}`);
    }

    // Set isValid based on issues
    result.isValid = result.issues.length === 0;
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.issues.push(`Validation error: ${errorMessage || 'Unknown error'}`);
    return result;
  }
}

/**
 * Get validation warnings for the current dataset
 * @returns Array of warning messages
 */
export async function getDatasetValidationWarnings(): Promise<string[]> {
  const validation = await validateDataset();
  
  if (validation.isValid) {
    return [];
  }
  
  return [
    `Dataset validation failed: ${validation.datasetName}`,
    ...validation.issues
  ];
}

/**
 * Perform a full validation of the current dataset
 * This should be called at system startup
 */
export async function runDatasetValidation(): Promise<void> {
  const validation = await validateDataset();
  
  if (!validation.isValid) {
    console.error('⚠️ DATASET VALIDATION WARNINGS:');
    validation.issues.forEach(issue => console.error(`- ${issue}`));
    console.error('-----------------------------------');
  } else {
    console.log('✅ Dataset validation successful:', validation.datasetName);
  }
}

export default {
  validateDataset,
  getDatasetValidationWarnings,
  runDatasetValidation
};