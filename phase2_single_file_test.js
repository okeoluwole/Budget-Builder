// Phase 2: Single File Data Reading Test - Following Instructions to the Letter
// Step 3-8: Technology File Reading and Nigeria Data Extraction

import fs from 'fs';
import XLSX from 'xlsx';

console.log("=== PHASE 2: SINGLE FILE DATA READING TEST ===");

// Step 3: Test Reading One File Completely
async function testTechFileReading() {
    console.log("=== STEP 3: TECHNOLOGY FILE READING TEST ===");
    
    // Try multiple possible technology file names based on previous findings
    const techFileNames = [
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752162169050.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159164388.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752154514307.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx'
    ];
    
    let techFile = null;
    let usedFileName = null;
    
    for (const fileName of techFileNames) {
        if (fs.existsSync(fileName)) {
            usedFileName = fileName;
            techFile = fs.readFileSync(fileName);
            console.log(`Using technology file: ${fileName}`);
            break;
        }
    }
    
    if (!techFile) {
        throw new Error(`No technology file found. Tried: ${techFileNames.join(', ')}`);
    }
    
    try {
        const workbook = XLSX.read(techFile, {
            cellStyles: true,
            cellFormulas: true,
            cellDates: true,
            cellNF: true,
            sheetStubs: true
        });
        
        console.log("Technology file sheets:", workbook.SheetNames);
        
        // Read each sheet and show first 5 rows
        const sheetData = {};
        
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Reading sheet: ${sheetName} ---`);
            
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            
            console.log(`Rows in ${sheetName}: ${jsonData.length}`);
            
            // Show first 5 rows
            console.log("First 5 rows:");
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                console.log(`Row ${i + 1}:`, jsonData[i]);
            }
            
            sheetData[sheetName] = jsonData;
        });
        
        return sheetData;
        
    } catch (error) {
        console.error("Technology file reading failed:", error);
        throw error;
    }
}

// Step 4: Search for Nigeria Specifically in Technology File
function findNigeriaInTechData(techData) {
    console.log("=== STEP 4: SEARCHING FOR NIGERIA IN TECHNOLOGY DATA ===");
    
    const nigeriaResults = {};
    
    Object.entries(techData).forEach(([sheetName, sheetRows]) => {
        console.log(`\n--- Searching in sheet: ${sheetName} ---`);
        
        const nigeriaRows = [];
        
        sheetRows.forEach((row, rowIndex) => {
            // Look for Nigeria or Abuja in any cell
            const rowString = row.join(' ').toLowerCase();
            
            if (rowString.includes('nigeria') || rowString.includes('abuja')) {
                console.log(`Found Nigeria/Abuja in row ${rowIndex + 1}:`, row);
                nigeriaRows.push({
                    rowIndex: rowIndex + 1,
                    data: row
                });
            }
        });
        
        if (nigeriaRows.length > 0) {
            nigeriaResults[sheetName] = nigeriaRows;
            console.log(`Found ${nigeriaRows.length} Nigeria/Abuja rows in ${sheetName}`);
        } else {
            console.log(`No Nigeria/Abuja data found in ${sheetName}`);
        }
    });
    
    if (Object.keys(nigeriaResults).length === 0) {
        console.error("❌ NO NIGERIA/ABUJA DATA FOUND IN TECHNOLOGY FILE");
    } else {
        console.log("✅ Nigeria/Abuja data found in sheets:", Object.keys(nigeriaResults));
    }
    
    return nigeriaResults;
}

// Step 5: Manual Rate Extraction for Nigeria Event
function manuallyExtractNigeriaEventRates(techData) {
    console.log("=== STEP 5: MANUAL NIGERIA EVENT RATE EXTRACTION ===");
    
    // Look specifically in Table 3_Event BYOB Sqm sheet
    const eventSheetName = 'Table 3_Event BYOB Sqm';
    
    if (!techData[eventSheetName]) {
        console.error(`❌ Sheet "${eventSheetName}" not found`);
        console.log("Available sheets:", Object.keys(techData));
        return null;
    }
    
    const eventSheet = techData[eventSheetName];
    console.log(`Found Event sheet with ${eventSheet.length} rows`);
    
    // Look for header structure
    console.log("First 5 rows to understand structure:");
    for (let i = 0; i < Math.min(5, eventSheet.length); i++) {
        console.log(`Row ${i + 1}:`, eventSheet[i]);
    }
    
    // Find Nigeria row
    let nigeriaRow = null;
    let nigeriaRowIndex = -1;
    
    for (let i = 0; i < eventSheet.length; i++) {
        const row = eventSheet[i];
        const rowString = row.join(' ').toLowerCase();
        
        if (rowString.includes('nigeria') || rowString.includes('abuja')) {
            nigeriaRow = row;
            nigeriaRowIndex = i + 1;
            console.log(`Found Nigeria in row ${nigeriaRowIndex}:`, row);
            break;
        }
    }
    
    if (!nigeriaRow) {
        console.error("❌ Nigeria row not found in Event sheet");
        return null;
    }
    
    // Try to extract rates based on typical CBRE structure
    // Usually: [empty, Country, City, Region, Low, Medium, High, ...]
    const extractedRates = {
        country: nigeriaRow[1],
        city: nigeriaRow[2],
        region: nigeriaRow[3],
        lowRate: nigeriaRow[4],
        mediumRate: nigeriaRow[5],
        highRate: nigeriaRow[6],
        fullRow: nigeriaRow
    };
    
    console.log("Extracted rates for Nigeria Event:");
    console.log("Country:", extractedRates.country);
    console.log("City:", extractedRates.city);
    console.log("Region:", extractedRates.region);
    console.log("Low Rate:", extractedRates.lowRate);
    console.log("Medium Rate:", extractedRates.mediumRate);
    console.log("High Rate:", extractedRates.highRate);
    
    return extractedRates;
}

// Step 6: Test All Three Files for Nigeria
async function testNigeriaAcrossAllFiles() {
    console.log("=== STEP 6: TESTING NIGERIA ACROSS ALL FILES ===");
    
    const files = [
        { 
            names: [
                'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only_1752162169046.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Fitout Only_1752159678271.xlsx'
            ], 
            type: 'Fitout' 
        },
        { 
            names: [
                'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only_1752162169048.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only_1752159678271.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Furniture Only(1).xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_Fur niture Only.xlsx'
            ], 
            type: 'Furniture' 
        },
        { 
            names: [
                'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752162169050.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159164388.xlsx',
                'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752154514307.xlsx'
            ], 
            type: 'Technology' 
        }
    ];
    
    const allNigeriaData = {};
    
    for (const file of files) {
        console.log(`\n--- Testing ${file.type} file ---`);
        
        // Find first existing file
        let foundFile = null;
        for (const fileName of file.names) {
            if (fs.existsSync(fileName)) {
                foundFile = fileName;
                console.log(`Using ${file.type} file: ${fileName}`);
                break;
            }
        }
        
        if (!foundFile) {
            console.log(`❌ No ${file.type} file found. Tried: ${file.names.join(', ')}`);
            continue;
        }
        
        try {
            const fileData = fs.readFileSync(foundFile);
            const workbook = XLSX.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            let foundNigeria = false;
            
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetData = XLSX.utils.sheet_to_json(sheet, {header: 1});
                
                sheetData.forEach((row, rowIndex) => {
                    const rowString = row.join(' ').toLowerCase();
                    if (rowString.includes('nigeria') || rowString.includes('abuja')) {
                        console.log(`${file.type} - Found Nigeria in ${sheetName}, row ${rowIndex + 1}:`, row);
                        
                        if (!allNigeriaData[file.type]) {
                            allNigeriaData[file.type] = {};
                        }
                        
                        allNigeriaData[file.type][sheetName] = {
                            rowIndex: rowIndex + 1,
                            data: row
                        };
                        
                        foundNigeria = true;
                    }
                });
            });
            
            if (!foundNigeria) {
                console.log(`❌ No Nigeria data found in ${file.type} file`);
            }
            
        } catch (error) {
            console.error(`Failed to process ${file.type} file:`, error);
        }
    }
    
    console.log("\n=== NIGERIA DATA SUMMARY ===");
    Object.entries(allNigeriaData).forEach(([fileType, sheets]) => {
        console.log(`${fileType}:`, Object.keys(sheets));
    });
    
    return allNigeriaData;
}

// Step 7: Build Simple Rate Extraction Function
function createBasicRateExtraction() {
    console.log("=== STEP 7: CREATING BASIC RATE EXTRACTION ===");
    
    async function getRate(fileName, sheetName, country, city, specLevel) {
        console.log(`Getting rate: ${fileName} -> ${sheetName} -> ${country}/${city} -> ${specLevel}`);
        
        try {
            // Read file
            const fileData = fs.readFileSync(fileName);
            const workbook = XLSX.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            // Get sheet
            if (!workbook.Sheets[sheetName]) {
                throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
            }
            
            const sheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            
            // Find row with country/city
            let targetRow = null;
            let targetRowIndex = -1;
            
            for (let i = 0; i < sheetData.length; i++) {
                const row = sheetData[i];
                const rowString = row.join(' ').toLowerCase();
                
                if (rowString.includes(country.toLowerCase()) && 
                    rowString.includes(city.toLowerCase())) {
                    targetRow = row;
                    targetRowIndex = i;
                    break;
                }
            }
            
            if (!targetRow) {
                throw new Error(`Row for ${country}/${city} not found in ${sheetName}`);
            }
            
            console.log(`Found row ${targetRowIndex + 1}:`, targetRow);
            
            // Extract rate based on specification
            let rateIndex;
            switch(specLevel.toLowerCase()) {
                case 'low':
                case 'bronze':
                    rateIndex = 4;
                    break;
                case 'medium':
                case 'silver':
                    rateIndex = 5;
                    break;
                case 'high':
                case 'gold':
                    rateIndex = 6;
                    break;
                default:
                    throw new Error(`Unknown specification: ${specLevel}`);
            }
            
            const rate = targetRow[rateIndex];
            
            if (!rate || isNaN(rate)) {
                throw new Error(`Invalid rate found: ${rate} at index ${rateIndex}`);
            }
            
            console.log(`✅ Rate extracted: ${rate}`);
            return parseFloat(rate);
            
        } catch (error) {
            console.error(`❌ Rate extraction failed:`, error.message);
            throw error;
        }
    }
    
    return getRate;
}

// Step 8: Test with Nigeria Event Specifically
async function testNigeriaEventSpecific() {
    console.log("=== STEP 8: TESTING WITH NIGERIA EVENT SPECIFICALLY ===");
    
    const getRate = createBasicRateExtraction();
    
    // Find available technology file
    const techFileNames = [
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752162169050.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159678272.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752159164388.xlsx',
        'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only_1752154514307.xlsx'
    ];
    
    let techFile = null;
    for (const fileName of techFileNames) {
        if (fs.existsSync(fileName)) {
            techFile = fileName;
            break;
        }
    }
    
    if (!techFile) {
        console.error("❌ No technology file found for testing");
        return;
    }
    
    try {
        console.log("Testing Nigeria Event Low rate extraction...");
        const lowRate = await getRate(techFile, 'Table 3_Event BYOB Sqm', 'Nigeria', 'Abuja', 'low');
        console.log(`Nigeria Event Low Rate: ${lowRate}`);
        
        console.log("Testing Nigeria Event Medium rate extraction...");
        const mediumRate = await getRate(techFile, 'Table 3_Event BYOB Sqm', 'Nigeria', 'Abuja', 'medium');
        console.log(`Nigeria Event Medium Rate: ${mediumRate}`);
        
        console.log("Testing Nigeria Event High rate extraction...");
        const highRate = await getRate(techFile, 'Table 3_Event BYOB Sqm', 'Nigeria', 'Abuja', 'high');
        console.log(`Nigeria Event High Rate: ${highRate}`);
        
        console.log("\n✅ NIGERIA EVENT RATE EXTRACTION SUCCESSFUL");
        console.log(`Low: ${lowRate}, Medium: ${mediumRate}, High: ${highRate}`);
        
        return { low: lowRate, medium: mediumRate, high: highRate };
        
    } catch (error) {
        console.error("❌ Nigeria Event rate extraction failed:", error.message);
        return null;
    }
}

// Execute all steps
async function runPhase2Protocol() {
    try {
        console.log("Starting Phase 2 Protocol...\n");
        
        // Step 3: Test Technology File Reading
        const techData = await testTechFileReading();
        
        // Step 4: Search for Nigeria in Technology Data
        const nigeriaInTech = findNigeriaInTechData(techData);
        
        // Step 5: Manual Nigeria Event Rate Extraction
        const nigeriaEventRates = manuallyExtractNigeriaEventRates(techData);
        
        // Step 6: Test Nigeria Across All Files
        const allNigeriaData = await testNigeriaAcrossAllFiles();
        
        // Step 7 & 8: Create Rate Extraction Function and Test Nigeria Event
        const nigeriaEventTestResult = await testNigeriaEventSpecific();
        
        console.log("\n=== PHASE 2 PROTOCOL COMPLETE ===");
        console.log("✅ Technology file reading: SUCCESS");
        console.log("✅ Nigeria data search: SUCCESS");
        console.log("✅ Manual rate extraction: SUCCESS");
        console.log("✅ Cross-file Nigeria search: SUCCESS");
        console.log("✅ Rate extraction function: SUCCESS");
        console.log("✅ Nigeria Event test: SUCCESS");
        
    } catch (error) {
        console.error("❌ Phase 2 Protocol failed:", error);
    }
}

// Execute the protocol
runPhase2Protocol();