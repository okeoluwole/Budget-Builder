import XLSX from 'xlsx';
import { join } from 'path';

/**
 * Read the Excel file and return the workbook
 * @param filePath Path to the Excel file
 * @returns Parsed workbook from the Excel file
 */
export async function parseExcelFile(filePath: string): Promise<XLSX.WorkBook> {
  try {
    console.log("Reading Excel file:", filePath);
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get all sheets
    const sheetNames = workbook.SheetNames;
    console.log("Available sheets:", sheetNames);
    
    // Log a sample from each sheet for debugging
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = sheetToJson(worksheet);
      
      // Log the first row of each sheet for debugging
      if (data.length > 0) {
        console.log(`First row of sheet ${sheetName}:`, data[0]);
      } else {
        console.log(`Sheet ${sheetName} is empty`);
      }
    }
    
    return workbook;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
}

/**
 * Convert a worksheet to JSON
 * @param worksheet The worksheet to convert
 * @returns Array of objects representing rows
 */
export function sheetToJson(worksheet: XLSX.WorkSheet): any[] {
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Read the Excel file and return the data in a structured format
 * @param filePath Path to the Excel file
 * @returns Parsed data from the Excel file with sheets as keys
 */
export async function parseExcelToJSON(filePath: string): Promise<Record<string, any[]>> {
  try {
    const workbook = await parseExcelFile(filePath);
    
    // Parse each sheet
    const result: Record<string, any[]> = {};
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = sheetToJson(worksheet);
      result[sheetName] = data;
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing Excel file to JSON:', error);
    throw error;
  }
}