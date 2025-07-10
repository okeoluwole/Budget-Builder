// CBRE Data Extraction Emergency Debug Protocol - Step by Step
// Following exact instructions provided

import fs from 'fs';
import XLSX from 'xlsx';

console.log("=== CBRE DATA EXTRACTION EMERGENCY DEBUG PROTOCOL ===");

// Step 1: Basic File Access Verification
async function verifyFileAccess() {
    console.log("=== STEP 1: BASIC FILE ACCESS VERIFICATION ===");
    
    const expectedFiles = [
        'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx', 
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx'
    ];
    
    const fileAccessResults = {};
    
    for (const fileName of expectedFiles) {
        try {
            console.log(`Testing access to: ${fileName}`);
            
            // Check if file exists
            if (!fs.existsSync(fileName)) {
                fileAccessResults[fileName] = {
                    accessible: false,
                    error: 'File not found'
                };
                console.error(`❌ ${fileName}: File not found`);
                continue;
            }
            
            // Read file data
            const fileData = fs.readFileSync(fileName);
            
            fileAccessResults[fileName] = {
                accessible: true,
                size: fileData.length,
                type: typeof fileData
            };
            
            console.log(`✅ ${fileName}: Accessible (${fileData.length} bytes)`);
            
        } catch (error) {
            fileAccessResults[fileName] = {
                accessible: false,
                error: error.message
            };
            
            console.error(`❌ ${fileName}: ${error.message}`);
        }
    }
    
    console.log("\nFile Access Summary:", fileAccessResults);
    
    // Stop here if any files are inaccessible
    const allAccessible = Object.values(fileAccessResults).every(result => result.accessible);
    if (!allAccessible) {
        throw new Error("Some CBRE files are not accessible. Fix file access before proceeding.");
    }
    
    return fileAccessResults;
}

// Step 2: Basic Workbook Structure Analysis
async function analyzeWorkbookStructures() {
    console.log("=== STEP 2: WORKBOOK STRUCTURE ANALYSIS ===");
    
    const structures = {};
    
    const files = [
        'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx', 
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx'
    ];
    
    for (const fileName of files) {
        console.log(`\n--- Analyzing ${fileName} ---`);
        
        try {
            // Check if file exists first
            if (!fs.existsSync(fileName)) {
                console.log(`File not found: ${fileName}`);
                structures[fileName] = { error: 'File not found' };
                continue;
            }
            
            const fileData = fs.readFileSync(fileName);
            const workbook = XLSX.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`);
            
            structures[fileName] = {
                sheetNames: workbook.SheetNames,
                sheetCount: workbook.SheetNames.length
            };
            
            // For each sheet, just get basic info
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const range = sheet['!ref'];
                console.log(`  Sheet "${sheetName}": Range ${range || 'N/A'}`);
            });
            
        } catch (error) {
            console.error(`Failed to analyze ${fileName}:`, error);
            structures[fileName] = { error: error.message };
        }
    }
    
    return structures;
}

// Step 3: Check what files actually exist in the directory
async function checkActualFiles() {
    console.log("=== STEP 3: CHECK ACTUAL FILES IN DIRECTORY ===");
    
    try {
        const files = fs.readdirSync('attached_assets/');
        console.log("All files in attached_assets directory:");
        
        const cbreFiles = files.filter(file => 
            file.toLowerCase().includes('cbre') && 
            file.toLowerCase().includes('.xlsx')
        );
        
        console.log("\nCBRE Excel files found:");
        cbreFiles.forEach((file, index) => {
            const fullPath = `attached_assets/${file}`;
            const stats = fs.statSync(fullPath);
            console.log(`${index + 1}. ${file} (${stats.size} bytes)`);
        });
        
        return cbreFiles;
        
    } catch (error) {
        console.error("Error reading directory:", error);
        return [];
    }
}

// Execute the debug protocol step by step
async function runStepByStepDebug() {
    try {
        console.log("Starting step-by-step CBRE debug protocol...\n");
        
        // Step 1: Basic file access
        console.log("EXECUTING STEP 1...");
        let fileAccess;
        try {
            fileAccess = await verifyFileAccess();
            console.log("✅ STEP 1 COMPLETED");
        } catch (error) {
            console.log("❌ STEP 1 FAILED:", error.message);
            console.log("Proceeding to check actual files...");
        }
        
        // Step 3: Check what files actually exist
        console.log("\nEXECUTING STEP 3...");
        const actualFiles = await checkActualFiles();
        console.log("✅ STEP 3 COMPLETED");
        
        // Step 2: Workbook structure analysis (only if files are accessible)
        console.log("\nEXECUTING STEP 2...");
        let structures;
        try {
            structures = await analyzeWorkbookStructures();
            console.log("✅ STEP 2 COMPLETED");
        } catch (error) {
            console.log("❌ STEP 2 FAILED:", error.message);
        }
        
        // Summary
        console.log("\n=== DEBUG PROTOCOL SUMMARY ===");
        console.log("Step 1 (File Access):", fileAccess ? "✅ PASSED" : "❌ FAILED");
        console.log("Step 2 (Workbook Analysis):", structures ? "✅ PASSED" : "❌ FAILED");
        console.log("Step 3 (Actual Files Check):", actualFiles.length > 0 ? "✅ PASSED" : "❌ FAILED");
        
        if (actualFiles.length > 0) {
            console.log(`\nFound ${actualFiles.length} CBRE files in directory`);
            console.log("Files:", actualFiles.join(', '));
        }
        
        console.log("\n=== NEXT STEPS RECOMMENDATION ===");
        if (!fileAccess) {
            console.log("1. File access issues detected - check file paths and permissions");
        }
        if (actualFiles.length === 0) {
            console.log("2. No CBRE files found - verify files are uploaded to attached_assets/");
        }
        if (actualFiles.length > 0 && !structures) {
            console.log("3. Files exist but workbook analysis failed - check Excel file integrity");
        }
        
    } catch (error) {
        console.error("Critical error in debug protocol:", error);
    }
}

// Execute the protocol
runStepByStepDebug();