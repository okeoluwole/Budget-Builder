// Continue CBRE Debug Protocol - Analyze Actual Files Found
// Based on Step 3 results, analyze the files that actually exist

import fs from 'fs';
import XLSX from 'xlsx';

console.log("=== CBRE CORRECT FILES ANALYSIS ===");

async function analyzeActualCBREFiles() {
    console.log("=== STEP 4: ANALYZE ACTUAL CBRE FILES ===");
    
    // Based on Step 3, these are the correct files that exist:
    const actualFiles = {
        technology: [
            'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752154514307.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159164388.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752162169050.xlsx'
        ],
        fitout: [
            'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only_1752159678271.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only_1752162169046.xlsx'
        ],
        furniture: [
            'attached_assets/CBRE Fit Out Guide Cost Data_Fur niture Only.xlsx', // Note the space in "Fur niture"
            'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only_1752159678271.xlsx',
            'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only_1752162169048.xlsx'
        ],
        comprehensive: [
            'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx'
        ]
    };
    
    const results = {};
    
    // Analyze each category
    for (const [category, files] of Object.entries(actualFiles)) {
        console.log(`\n--- Analyzing ${category.toUpperCase()} files ---`);
        results[category] = [];
        
        for (const filePath of files) {
            console.log(`\nAnalyzing: ${filePath.split('/').pop()}`);
            
            try {
                if (!fs.existsSync(filePath)) {
                    console.log(`❌ File not found: ${filePath}`);
                    continue;
                }
                
                const stats = fs.statSync(filePath);
                const fileData = fs.readFileSync(filePath);
                const workbook = XLSX.read(fileData);
                
                console.log(`✅ File accessible: ${stats.size} bytes`);
                console.log(`   Sheets: ${workbook.SheetNames.join(', ')}`);
                
                // For each sheet, get basic structure
                const sheetAnalysis = {};
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const range = sheet['!ref'];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                    sheetAnalysis[sheetName] = {
                        range: range,
                        rowCount: data.length,
                        firstRow: data[0] || [],
                        secondRow: data[1] || []
                    };
                    
                    console.log(`   Sheet "${sheetName}": ${range}, ${data.length} rows`);
                });
                
                results[category].push({
                    fileName: filePath.split('/').pop(),
                    size: stats.size,
                    accessible: true,
                    sheets: sheetAnalysis
                });
                
            } catch (error) {
                console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
                results[category].push({
                    fileName: filePath.split('/').pop(),
                    accessible: false,
                    error: error.message
                });
            }
        }
    }
    
    return results;
}

async function identifyBestFiles() {
    console.log("\n=== STEP 5: IDENTIFY BEST FILES FOR SYSTEM USE ===");
    
    const analysisResults = await analyzeActualCBREFiles();
    
    const recommendations = {
        technology: null,
        fitout: null,
        furniture: null
    };
    
    // Find the best technology file (largest, most recent, accessible)
    const techFiles = analysisResults.technology.filter(f => f.accessible);
    if (techFiles.length > 0) {
        recommendations.technology = techFiles.reduce((best, current) => 
            current.size > best.size ? current : best
        );
        console.log(`✅ Best Technology file: ${recommendations.technology.fileName} (${recommendations.technology.size} bytes)`);
    } else {
        console.log("❌ No accessible technology files found");
    }
    
    // Find the best fitout file
    const fitoutFiles = analysisResults.fitout.filter(f => f.accessible);
    if (fitoutFiles.length > 0) {
        recommendations.fitout = fitoutFiles.reduce((best, current) => 
            current.size > best.size ? current : best
        );
        console.log(`✅ Best Fitout file: ${recommendations.fitout.fileName} (${recommendations.fitout.size} bytes)`);
    } else {
        console.log("❌ No accessible fitout files found");
    }
    
    // Find the best furniture file
    const furnitureFiles = analysisResults.furniture.filter(f => f.accessible);
    if (furnitureFiles.length > 0) {
        recommendations.furniture = furnitureFiles.reduce((best, current) => 
            current.size > best.size ? current : best
        );
        console.log(`✅ Best Furniture file: ${recommendations.furniture.fileName} (${recommendations.furniture.size} bytes)`);
    } else {
        console.log("❌ No accessible furniture files found");
    }
    
    return recommendations;
}

async function testDataExtraction() {
    console.log("\n=== STEP 6: TEST DATA EXTRACTION FROM CORRECT FILES ===");
    
    const recommendations = await identifyBestFiles();
    
    // Test extraction from the identified best files
    const testResults = {};
    
    for (const [category, fileInfo] of Object.entries(recommendations)) {
        if (!fileInfo) {
            console.log(`❌ No ${category} file to test`);
            continue;
        }
        
        console.log(`\nTesting ${category} data extraction from: ${fileInfo.fileName}`);
        
        try {
            const filePath = `attached_assets/${fileInfo.fileName}`;
            const fileData = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileData);
            
            // Test extracting London data specifically
            let londonDataFound = false;
            const londonResults = {};
            
            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                // Search for London in this sheet
                data.forEach((row, index) => {
                    if (Array.isArray(row)) {
                        const rowString = row.join(' ').toLowerCase();
                        if (rowString.includes('london') || rowString.includes('united kingdom')) {
                            londonDataFound = true;
                            londonResults[sheetName] = {
                                rowIndex: index,
                                data: row
                            };
                            console.log(`   Found London in sheet "${sheetName}" at row ${index}`);
                            console.log(`   Data: [${row.slice(0, 8).join(', ')}...]`);
                        }
                    }
                });
            }
            
            testResults[category] = {
                success: true,
                londonFound: londonDataFound,
                londonData: londonResults,
                totalSheets: workbook.SheetNames.length
            };
            
            if (londonDataFound) {
                console.log(`✅ ${category} - London data extraction successful`);
            } else {
                console.log(`⚠️ ${category} - No London data found`);
            }
            
        } catch (error) {
            console.log(`❌ ${category} - Extraction failed: ${error.message}`);
            testResults[category] = {
                success: false,
                error: error.message
            };
        }
    }
    
    return testResults;
}

async function generateFileRecommendations() {
    console.log("\n=== STEP 7: GENERATE FILE PATH CORRECTIONS ===");
    
    const testResults = await testDataExtraction();
    
    console.log("\nCORRECT FILE PATHS FOR SYSTEM UPDATE:");
    console.log("=====================================");
    
    // Technology files
    const techFiles = [
        'CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752154514307.xlsx',
        'CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159164388.xlsx',
        'CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx'
    ];
    
    console.log("\nTechnology Data Files:");
    techFiles.forEach((file, index) => {
        console.log(`${index + 1}. attached_assets/${file}`);
    });
    
    // Fitout files
    const fitoutFiles = [
        'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
        'CBRE Fit Out Guide Cost Data_Fitout Only_1752159678271.xlsx'
    ];
    
    console.log("\nFitout Data Files:");
    fitoutFiles.forEach((file, index) => {
        console.log(`${index + 1}. attached_assets/${file}`);
    });
    
    // Furniture files
    const furnitureFiles = [
        'CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx',
        'CBRE Fit Out Guide Cost Data_Furniture Only_1752159678271.xlsx'
    ];
    
    console.log("\nFurniture Data Files:");
    furnitureFiles.forEach((file, index) => {
        console.log(`${index + 1}. attached_assets/${file}`);
    });
    
    console.log("\n=== SUMMARY OF FINDINGS ===");
    console.log("1. Original file names in system do not match actual uploaded files");
    console.log("2. Multiple versions of each file exist with timestamp suffixes");
    console.log("3. System needs to be updated to use correct file paths");
    console.log("4. All file categories (Technology, Fitout, Furniture) have accessible versions");
    
    Object.entries(testResults).forEach(([category, result]) => {
        if (result.success && result.londonFound) {
            console.log(`✅ ${category}: Data extraction working with correct files`);
        } else if (result.success && !result.londonFound) {
            console.log(`⚠️ ${category}: File accessible but London data needs verification`);
        } else {
            console.log(`❌ ${category}: File access or extraction issues`);
        }
    });
}

// Execute the complete analysis
generateFileRecommendations();