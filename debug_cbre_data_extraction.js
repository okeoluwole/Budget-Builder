// CBRE Data Extraction Emergency Debug Protocol
// Systematic verification of data extraction accuracy

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("=== CBRE DATA EXTRACTION EMERGENCY DEBUG ===");

async function analyzeCBREFileStructures() {
    console.log("\n=== PHASE 1: FILE ACCESS VERIFICATION ===");
    
    const expectedFiles = [
        'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx', 
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx'
    ];
    
    const fileResults = {};
    
    for (const filePath of expectedFiles) {
        try {
            console.log(`\nTesting: ${filePath}`);
            
            // Check file existence
            if (!fs.existsSync(filePath)) {
                console.error(`❌ File does not exist: ${filePath}`);
                fileResults[filePath] = { accessible: false, error: 'File not found' };
                continue;
            }
            
            // Get file stats
            const stats = fs.statSync(filePath);
            console.log(`✅ File exists: ${stats.size} bytes`);
            
            // Try to read with XLSX
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            
            console.log(`✅ Excel readable: ${sheetNames.length} sheets`);
            console.log(`   Sheets: ${sheetNames.join(', ')}`);
            
            fileResults[filePath] = {
                accessible: true,
                size: stats.size,
                sheetCount: sheetNames.length,
                sheets: sheetNames
            };
            
        } catch (error) {
            console.error(`❌ Error accessing ${filePath}: ${error.message}`);
            fileResults[filePath] = {
                accessible: false,
                error: error.message
            };
        }
    }
    
    console.log("\n=== FILE ACCESS SUMMARY ===");
    Object.entries(fileResults).forEach(([file, result]) => {
        const fileName = file.split('/').pop();
        if (result.accessible) {
            console.log(`✅ ${fileName}: ${result.size} bytes, ${result.sheetCount} sheets`);
        } else {
            console.log(`❌ ${fileName}: ${result.error}`);
        }
    });
    
    const accessibleCount = Object.values(fileResults).filter(r => r.accessible).length;
    console.log(`\nAccessible files: ${accessibleCount}/${expectedFiles.length}`);
    
    if (accessibleCount === 0) {
        throw new Error("CRITICAL: No CBRE files are accessible");
    }
    
    return fileResults;
}

async function analyzeTechnologyDataStructure() {
    console.log("\n=== PHASE 2: TECHNOLOGY DATA STRUCTURE ANALYSIS ===");
    
    const techFile = 'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx';
    
    if (!fs.existsSync(techFile)) {
        console.error("❌ Technology file not found");
        return;
    }
    
    try {
        const workbook = XLSX.readFile(techFile);
        console.log(`Technology file sheets: ${workbook.SheetNames.join(', ')}`);
        
        // Analyze first sheet structure
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        console.log(`\nFirst sheet analysis (${workbook.SheetNames[0]}):`);
        console.log(`Total rows: ${data.length}`);
        
        // Show first 5 rows
        console.log("\nFirst 5 rows:");
        data.slice(0, 5).forEach((row, index) => {
            console.log(`Row ${index}:`, row);
        });
        
        // Look for London data specifically
        console.log("\n=== LONDON TECHNOLOGY DATA SEARCH ===");
        let londonFound = false;
        
        data.forEach((row, index) => {
            if (Array.isArray(row)) {
                const rowString = row.join(' ').toLowerCase();
                if (rowString.includes('london') || rowString.includes('united kingdom')) {
                    console.log(`Found London data at row ${index}:`, row);
                    londonFound = true;
                }
            }
        });
        
        if (!londonFound) {
            console.log("❌ No London data found in technology file");
        }
        
        return { sheets: workbook.SheetNames, rowCount: data.length, hasLondon: londonFound };
        
    } catch (error) {
        console.error(`❌ Error analyzing technology file: ${error.message}`);
        return null;
    }
}

async function analyzeFitoutDataStructure() {
    console.log("\n=== PHASE 3: FITOUT DATA STRUCTURE ANALYSIS ===");
    
    const fitoutFile = 'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx';
    
    if (!fs.existsSync(fitoutFile)) {
        console.error("❌ Fitout file not found");
        return;
    }
    
    try {
        const workbook = XLSX.readFile(fitoutFile);
        console.log(`Fitout file sheets: ${workbook.SheetNames.join(', ')}`);
        
        // Analyze Team BYOB Sqm sheet specifically (where London Team High should be)
        const teamSheet = workbook.Sheets['Table 2_Team BYOB Sqm'];
        if (!teamSheet) {
            console.error("❌ Team BYOB Sqm sheet not found");
            return;
        }
        
        const data = XLSX.utils.sheet_to_json(teamSheet, { header: 1 });
        console.log(`\nTeam sheet analysis:`);
        console.log(`Total rows: ${data.length}`);
        
        // Show header structure
        console.log("\nFirst 5 rows:");
        data.slice(0, 5).forEach((row, index) => {
            console.log(`Row ${index}:`, row);
        });
        
        // Search for London Team High data
        console.log("\n=== LONDON TEAM HIGH FITOUT SEARCH ===");
        let londonTeamHigh = null;
        
        data.forEach((row, index) => {
            if (Array.isArray(row)) {
                const rowString = row.join(' ').toLowerCase();
                if (rowString.includes('london') || rowString.includes('united kingdom')) {
                    console.log(`Found London at row ${index}:`, row);
                    londonTeamHigh = row;
                }
            }
        });
        
        if (londonTeamHigh) {
            console.log("✅ London Team data found");
            // Expected: Team High should be around $2,617.63/sqm
            console.log("Expected Team High rate: ~$2,617.63/sqm");
            console.log("Checking if High specification column contains this value...");
        } else {
            console.log("❌ No London data found in fitout file");
        }
        
        return { sheets: workbook.SheetNames, rowCount: data.length, londonData: londonTeamHigh };
        
    } catch (error) {
        console.error(`❌ Error analyzing fitout file: ${error.message}`);
        return null;
    }
}

async function analyzeFurnitureDataStructure() {
    console.log("\n=== PHASE 4: FURNITURE DATA STRUCTURE ANALYSIS ===");
    
    const furnitureFile = 'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx';
    
    if (!fs.existsSync(furnitureFile)) {
        console.error("❌ Furniture file not found");
        return;
    }
    
    try {
        const workbook = XLSX.readFile(furnitureFile);
        console.log(`Furniture file sheets: ${workbook.SheetNames.join(', ')}`);
        
        // Analyze Team BYOB Sqm sheet
        const teamSheet = workbook.Sheets['Table 2_Team BYOB Sqm'];
        if (!teamSheet) {
            console.error("❌ Team BYOB Sqm sheet not found");
            return;
        }
        
        const data = XLSX.utils.sheet_to_json(teamSheet, { header: 1 });
        console.log(`\nFurniture Team sheet analysis:`);
        console.log(`Total rows: ${data.length}`);
        
        // Search for London Team High furniture data
        console.log("\n=== LONDON TEAM HIGH FURNITURE SEARCH ===");
        let londonFurnitureData = null;
        
        data.forEach((row, index) => {
            if (Array.isArray(row)) {
                const rowString = row.join(' ').toLowerCase();
                if (rowString.includes('london') || rowString.includes('united kingdom')) {
                    console.log(`Found London furniture at row ${index}:`, row);
                    londonFurnitureData = row;
                }
            }
        });
        
        if (londonFurnitureData) {
            console.log("✅ London furniture data found");
            // Expected: Team High should be around $489.38/sqm
            console.log("Expected Team High furniture rate: ~$489.38/sqm");
        } else {
            console.log("❌ No London furniture data found");
        }
        
        return { sheets: workbook.SheetNames, rowCount: data.length, londonData: londonFurnitureData };
        
    } catch (error) {
        console.error(`❌ Error analyzing furniture file: ${error.message}`);
        return null;
    }
}

async function generateValidationSummary() {
    console.log("\n=== VALIDATION SUMMARY ===");
    
    try {
        // Get current system calculation for London Team High
        console.log("Fetching current system calculation for London Team High...");
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('http://localhost:5000/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: {
                    name: "Debug Test",
                    country: "United Kingdom",
                    city: "London",
                    totalArea: 1000,
                    areaUnit: "sqm",
                    currency: "USD"
                },
                budget: {
                    scope: "Complete",
                    specification: "High",
                    layout: "Team",
                    primaryDataSource: "CBRE"
                }
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            console.log("\n=== CURRENT SYSTEM OUTPUT ===");
            console.log(`Technology: $${(result.technologyCost / 1000).toFixed(2)}/sqm`);
            console.log(`Fitout: $${(result.fitoutCost / 1000).toFixed(2)}/sqm`);
            console.log(`Furniture: $${(result.furnitureCost / 1000).toFixed(2)}/sqm`);
            console.log(`Total: $${(result.totalCost / 1000).toFixed(2)}/sqm`);
            
            console.log("\n=== EXPECTED RATES (from previous validation) ===");
            console.log("Technology: $396.91/sqm");
            console.log("Fitout: $2,617.63/sqm");
            console.log("Furniture: $489.38/sqm");
            
            console.log("\n=== ACCURACY CHECK ===");
            const techAccurate = Math.abs((result.technologyCost / 1000) - 396.91) < 1;
            const fitoutAccurate = Math.abs((result.fitoutCost / 1000) - 2617.63) < 1;
            const furnitureAccurate = Math.abs((result.furnitureCost / 1000) - 489.38) < 1;
            
            console.log(`Technology accurate: ${techAccurate ? '✅' : '❌'}`);
            console.log(`Fitout accurate: ${fitoutAccurate ? '✅' : '❌'}`);
            console.log(`Furniture accurate: ${furnitureAccurate ? '✅' : '❌'}`);
            
            const overallAccuracy = techAccurate && fitoutAccurate && furnitureAccurate;
            console.log(`\nOverall data extraction accuracy: ${overallAccuracy ? '✅ CORRECT' : '❌ INCORRECT'}`);
            
            if (!overallAccuracy) {
                console.log("\n⚠️ DISCREPANCY DETECTED - Further investigation needed");
            }
            
        } else {
            console.log("❌ Failed to fetch current system calculation");
        }
        
    } catch (error) {
        console.error(`❌ Error in validation summary: ${error.message}`);
    }
}

async function runCBREDataDebugging() {
    try {
        console.log("Starting comprehensive CBRE data extraction debug...");
        
        const fileAccess = await analyzeCBREFileStructures();
        const techAnalysis = await analyzeTechnologyDataStructure();
        const fitoutAnalysis = await analyzeFitoutDataStructure();
        const furnitureAnalysis = await analyzeFurnitureDataStructure();
        
        await generateValidationSummary();
        
        console.log("\n=== DEBUG COMPLETE ===");
        console.log("All phases completed. Check output above for discrepancies.");
        
    } catch (error) {
        console.error(`❌ Critical error in debugging: ${error.message}`);
    }
}

// Execute debug protocol
runCBREDataDebugging();