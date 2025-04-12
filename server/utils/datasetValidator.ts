import fs from 'fs';
import path from 'path';
import { parseExcelFile } from './excelReader';

interface DatasetValidationResult {
  isValid: boolean;
  datasetName: string;
  issues: string[];
  timestamp: Date;
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
          
          // Check for expected columns
          const firstRow = sheetData[0];
          const requiredColumns = ['COUNTRY', 'CITY', 'REGION'];
          
          for (const column of requiredColumns) {
            if (!firstRow.hasOwnProperty(column)) {
              result.issues.push(`Sheet "${sheetName}" is missing required column "${column}"`);
            }
          }
          
          // Check for at least one valid data row (simple check)
          let hasValidDataRow = false;
          for (const row of sheetData) {
            if (row.COUNTRY && row.CITY && row.REGION) {
              hasValidDataRow = true;
              break;
            }
          }
          
          if (!hasValidDataRow) {
            result.issues.push(`Sheet "${sheetName}" has no valid data rows with required fields`);
          }
        }
      }
      
      // Additional checks for specific constants/values that identify this as the correct dataset
      // For example, check if specific benchmark values are present
      
      if (sheetNames.includes('Table 1_Activity BYOB Sqm')) {
        const activitySheet = excelData['Table 1_Activity BYOB Sqm'];
        // Look for a specific known value in the correct dataset
        let foundExpectedValue = false;
        
        for (const row of activitySheet) {
          if (row.COUNTRY === 'United Kingdom' && row.CITY === 'London') {
            foundExpectedValue = true;
            break;
          }
        }
        
        if (!foundExpectedValue) {
          result.issues.push('Expected benchmark data for London, UK not found in Activity sheet');
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