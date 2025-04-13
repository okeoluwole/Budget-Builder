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
  } catch (error) {
    result.isValid = false;
    result.issues.push(`Error validating furniture dataset: ${error.message}`);
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
      
      // Check expected sheets exist
      const requiredSheets = ['Table 1_Activity BYOB Sqm', 'Table 2_Team BYOB Sqm', 'Table 3_Event BYOB Sqm'];
      
      const sheetNames = Object.keys(excelData);
      for (const sheetName of requiredSheets) {
        if (!sheetNames.includes(sheetName)) {
          result.issues.push(`Required sheet "${sheetName}" not found in dataset`);
        }
      }
      
      // Sample data validation for each sheet
      for (const sheetName of requiredSheets) {
        if (sheetNames.includes(sheetName)) {
          const sheetData = excelData[sheetName];
          
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
      if (sheetNames.includes('Table 1_Activity BYOB Sqm')) {
        const activitySheet = excelData['Table 1_Activity BYOB Sqm'];
        
        // Check for common indicators that this is the correct file - expected regions or areas
        let foundLondonIndicator = false;
        let foundNewYorkIndicator = false;
        
        for (const row of activitySheet) {
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
    } catch (error: any) {
      result.issues.push(`Error parsing Excel file: ${error.message || 'Unknown error'}`);
    }

    // Set isValid based on issues
    result.isValid = result.issues.length === 0;
    
    return result;
  } catch (error: any) {
    result.issues.push(`Validation error: ${error.message || 'Unknown error'}`);
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