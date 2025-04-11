import XLSX from 'xlsx';
import { join } from 'path';

/**
 * Read the Excel file and return the data in a structured format
 * @param filePath Path to the Excel file
 * @returns Parsed data from the Excel file
 */
export async function parseExcelFile(filePath: string): Promise<any> {
  try {
    console.log("Reading Excel file:", filePath);
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get all sheets
    const sheetNames = workbook.SheetNames;
    console.log("Available sheets:", sheetNames);
    
    // Parse each sheet
    const result: Record<string, any[]> = {};
    
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      result[sheetName] = data;
      
      // Log the first row of each sheet for debugging
      if (data.length > 0) {
        console.log(`First row of sheet ${sheetName}:`, data[0]);
      } else {
        console.log(`Sheet ${sheetName} is empty`);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error;
  }
}