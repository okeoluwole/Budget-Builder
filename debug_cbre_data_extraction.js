// CBRE Data Extraction Debugging and Validation Script
// Following the comprehensive debugging protocol

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

console.log("=== CBRE DATA SOURCE INVENTORY ===");

const cbreDataSources = {
    techOnlyFile: "attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx", 
    fitoutOnlyFile: "attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only_1752159678271.xlsx",
    furnitureOnlyFile: "attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only_1752159678271.xlsx",
    // Also check existing files
    existingTechFile: "attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx",
    existingFitoutFile: "attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx",
    existingFurnitureFile: "attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx"
};

// Phase 1: Complete CBRE File Structure Analysis
async function analyzeCBREFileStructures() {
    console.log("\n=== ANALYZING ALL CBRE DATA FILES ===");
    
    for (const [fileType, fileName] of Object.entries(cbreDataSources)) {
        console.log(`\n=== ANALYZING ${fileType.toUpperCase()}: ${fileName} ===`);
        
        try {
            if (!fs.existsSync(fileName)) {
                console.log(`❌ File not found: ${fileName}`);
                continue;
            }
            
            const fileData = fs.readFileSync(fileName);
            const workbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log(`✅ Sheets in ${fileName}:`, workbook.SheetNames);
            
            // Analyze each sheet
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const range = sheet['!ref'];
                console.log(`  📊 Sheet "${sheetName}": Range ${range}`);
                
                // Sample first few rows
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                console.log(`  📝 First 3 rows:`, sheetData.slice(0, 3));
                
                // Look for London data specifically
                const londonRows = sheetData.filter((row, index) => {
                    if (index < 3) return false; // Skip headers
                    return row.some(cell => 
                        cell && cell.toString().toLowerCase().includes('london') ||
                        cell && cell.toString().toLowerCase().includes('kingdom')
                    );
                });
                
                if (londonRows.length > 0) {
                    console.log(`  🇬🇧 London data found in ${sheetName}:`, londonRows);
                }
            });
            
        } catch (error) {
            console.error(`❌ Error reading ${fileName}:`, error.message);
        }
    }
}

// Phase 2: Technology Data Deep Analysis
async function analyzeTechnologyDataStructure() {
    console.log("\n=== TECHNOLOGY DATA STRUCTURE ANALYSIS ===");
    
    // Check both existing and new tech files
    const techFiles = [
        cbreDataSources.techOnlyFile,
        cbreDataSources.existingTechFile
    ];
    
    for (const techFile of techFiles) {
        if (!fs.existsSync(techFile)) {
            console.log(`❌ Tech file not found: ${techFile}`);
            continue;
        }
        
        console.log(`\n--- ANALYZING TECH FILE: ${techFile} ---`);
        
        try {
            const fileData = fs.readFileSync(techFile);
            const techWorkbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log("Technology file sheets:", techWorkbook.SheetNames);
            
            // Analyze each sheet in detail
            techWorkbook.SheetNames.forEach(sheetName => {
                console.log(`\n--- TECH SHEET: ${sheetName} ---`);
                const sheet = techWorkbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                
                // Find London data specifically
                const londonRows = sheetData.filter((row, index) => {
                    if (index < 3) return false; // Skip headers
                    return row.some(cell => 
                        cell && (
                            cell.toString().toLowerCase().includes('london') ||
                            cell.toString().toLowerCase().includes('kingdom')
                        )
                    );
                });
                
                if (londonRows.length > 0) {
                    console.log(`🇬🇧 London tech data found in ${sheetName}:`);
                    londonRows.forEach((row, index) => {
                        console.log(`  Row ${index + 1}:`, {
                            Country: row[0],
                            City: row[1],
                            Region: row[2],
                            ActivityLow: row[4],
                            ActivityMed: row[5],
                            ActivityHigh: row[6],
                            TeamLow: row[7],
                            TeamMed: row[8],
                            TeamHigh: row[9]
                        });
                    });
                }
                
                // Check for header structure
                if (sheetData.length > 3) {
                    console.log(`📋 Headers in ${sheetName}:`);
                    console.log("Row 1:", sheetData[0]);
                    console.log("Row 2:", sheetData[1]); 
                    console.log("Row 3:", sheetData[2]);
                    if (sheetData[3]) console.log("Row 4:", sheetData[3]);
                }
            });
        } catch (error) {
            console.error(`❌ Error analyzing tech file ${techFile}:`, error.message);
        }
    }
}

// Phase 3: Fitout Data Analysis
async function analyzeFitoutDataStructure() {
    console.log("\n=== FITOUT DATA STRUCTURE ANALYSIS ===");
    
    const fitoutFiles = [
        cbreDataSources.fitoutOnlyFile,
        cbreDataSources.existingFitoutFile
    ];
    
    for (const fitoutFile of fitoutFiles) {
        if (!fs.existsSync(fitoutFile)) {
            console.log(`❌ Fitout file not found: ${fitoutFile}`);
            continue;
        }
        
        console.log(`\n--- ANALYZING FITOUT FILE: ${fitoutFile} ---`);
        
        try {
            const fileData = fs.readFileSync(fitoutFile);
            const fitoutWorkbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log("Fitout file sheets:", fitoutWorkbook.SheetNames);
            
            // Analyze each sheet for London data
            fitoutWorkbook.SheetNames.forEach(sheetName => {
                console.log(`\n--- FITOUT SHEET: ${sheetName} ---`);
                const sheet = fitoutWorkbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                
                // Find London data and rate structure
                const londonRows = sheetData.filter((row, index) => {
                    if (index < 3) return false; // Skip headers
                    return row.some(cell => 
                        cell && (
                            cell.toString().toLowerCase().includes('london') ||
                            cell.toString().toLowerCase().includes('kingdom')
                        )
                    );
                });
                
                if (londonRows.length > 0) {
                    console.log(`🇬🇧 London fitout data in ${sheetName}:`);
                    
                    // Extract specific rates for London
                    londonRows.forEach((row, index) => {
                        console.log(`  London row ${index + 1}:`, {
                            Country: row[0],
                            City: row[1],
                            Region: row[2], 
                            ActivityLow: row[3],
                            ActivityMedium: row[4],
                            ActivityHigh: row[5],
                            TeamLow: row[6],
                            TeamMedium: row[7], 
                            TeamHigh: row[8],
                            EventLow: row[9],
                            EventMedium: row[10],
                            EventHigh: row[11]
                        });
                    });
                }
                
                // Sample header structure
                if (sheetData.length > 2) {
                    console.log(`📋 Headers in ${sheetName}:`);
                    console.log("Row 1:", sheetData[0]);
                    console.log("Row 2:", sheetData[1]);
                    if (sheetData[2]) console.log("Row 3:", sheetData[2]);
                }
            });
        } catch (error) {
            console.error(`❌ Error analyzing fitout file ${fitoutFile}:`, error.message);
        }
    }
}

// Phase 4: Furniture Data Analysis
async function analyzeFurnitureDataStructure() {
    console.log("\n=== FURNITURE DATA STRUCTURE ANALYSIS ===");
    
    const furnitureFiles = [
        cbreDataSources.furnitureOnlyFile,
        cbreDataSources.existingFurnitureFile
    ];
    
    for (const furnitureFile of furnitureFiles) {
        if (!fs.existsSync(furnitureFile)) {
            console.log(`❌ Furniture file not found: ${furnitureFile}`);
            continue;
        }
        
        console.log(`\n--- ANALYZING FURNITURE FILE: ${furnitureFile} ---`);
        
        try {
            const fileData = fs.readFileSync(furnitureFile);
            const furnitureWorkbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log("Furniture file sheets:", furnitureWorkbook.SheetNames);
            
            // Find London furniture rates
            furnitureWorkbook.SheetNames.forEach(sheetName => {
                console.log(`\n--- FURNITURE SHEET: ${sheetName} ---`);
                const sheet = furnitureWorkbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                
                const londonRows = sheetData.filter((row, index) => {
                    if (index < 3) return false; // Skip headers
                    return row.some(cell => 
                        cell && (
                            cell.toString().toLowerCase().includes('london') ||
                            cell.toString().toLowerCase().includes('kingdom')
                        )
                    );
                });
                
                if (londonRows.length > 0) {
                    console.log(`🇬🇧 London furniture data in ${sheetName}:`);
                    londonRows.forEach((row, index) => {
                        console.log(`  Row ${index + 1}:`, {
                            Country: row[0],
                            City: row[1],
                            Region: row[2],
                            ActivityLow: row[3],
                            ActivityMed: row[4],
                            ActivityHigh: row[5],
                            TeamLow: row[6],
                            TeamMed: row[7],
                            TeamHigh: row[8],
                            EventLow: row[9],
                            EventMed: row[10],
                            EventHigh: row[11]
                        });
                    });
                }
                
                // Sample headers
                if (sheetData.length > 2) {
                    console.log(`📋 Headers in ${sheetName}:`);
                    console.log("Row 1:", sheetData[0]);
                    console.log("Row 2:", sheetData[1]);
                    if (sheetData[2]) console.log("Row 3:", sheetData[2]);
                }
            });
        } catch (error) {
            console.error(`❌ Error analyzing furniture file ${furnitureFile}:`, error.message);
        }
    }
}

// Phase 5: Data Validation Summary
async function generateValidationSummary() {
    console.log("\n=== CBRE DATA VALIDATION SUMMARY ===");
    
    const summary = {
        filesAnalyzed: Object.keys(cbreDataSources).length,
        filesFound: 0,
        londonDataFound: {
            technology: false,
            fitout: false,
            furniture: false
        },
        recommendations: []
    };
    
    // Count existing files
    for (const fileName of Object.values(cbreDataSources)) {
        if (fs.existsSync(fileName)) {
            summary.filesFound++;
        }
    }
    
    console.log("📊 Files Analysis Summary:");
    console.log(`  Total files configured: ${summary.filesAnalyzed}`);
    console.log(`  Files found: ${summary.filesFound}`);
    console.log(`  Missing files: ${summary.filesAnalyzed - summary.filesFound}`);
    
    // Generate recommendations
    if (summary.filesFound < summary.filesAnalyzed) {
        summary.recommendations.push("Upload missing CBRE data files");
    }
    
    console.log("\n📋 Recommendations:");
    summary.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
    });
    
    return summary;
}

// Main execution function
async function runCBREDataDebugging() {
    console.log("🚀 Starting CBRE Data Extraction Debugging Process");
    console.log("=" .repeat(60));
    
    try {
        await analyzeCBREFileStructures();
        await analyzeTechnologyDataStructure();
        await analyzeFitoutDataStructure();
        await analyzeFurnitureDataStructure();
        await generateValidationSummary();
        
        console.log("\n✅ CBRE Data Debugging Complete");
        console.log("=" .repeat(60));
        
    } catch (error) {
        console.error("❌ CBRE Data Debugging Failed:", error);
    }
}

// Execute the debugging process
runCBREDataDebugging();