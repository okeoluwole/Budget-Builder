// CBRE Official Source Documents Analysis
// Analyzing the authoritative CBRE data files in the Source Documents folder

import fs from 'fs';
import xlsx from 'xlsx';

console.log("=== CBRE OFFICIAL SOURCE DOCUMENTS ANALYSIS ===");

const officialCBRESources = {
    techFile: "attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx",
    fitoutFile: "attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx", 
    furnitureFile: "attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx"
};

// Analyze official source documents
async function analyzeOfficialCBREDocuments() {
    console.log("\n=== ANALYZING OFFICIAL CBRE SOURCE DOCUMENTS ===");
    
    for (const [fileType, fileName] of Object.entries(officialCBRESources)) {
        console.log(`\n--- OFFICIAL ${fileType.toUpperCase()}: ${fileName} ---`);
        
        if (!fs.existsSync(fileName)) {
            console.log(`❌ Official file not found: ${fileName}`);
            continue;
        }
        
        try {
            const fileData = fs.readFileSync(fileName);
            const workbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            console.log(`✅ Official ${fileType} sheets:`, workbook.SheetNames);
            
            // Analyze each sheet structure
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const range = sheet['!ref'];
                console.log(`  📊 Sheet "${sheetName}": Range ${range}`);
                
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                
                // Sample headers and data structure
                console.log(`  📋 Headers (first 3 rows):`);
                for (let i = 0; i < Math.min(3, sheetData.length); i++) {
                    console.log(`    Row ${i + 1}:`, sheetData[i]);
                }
                
                // Find key location data samples
                const dataRows = sheetData.slice(3); // Skip headers
                const sampleLocations = ['London', 'New York', 'Singapore', 'Nigeria'];
                
                sampleLocations.forEach(location => {
                    const locationRows = dataRows.filter(row => 
                        row.some(cell => 
                            cell && cell.toString().toLowerCase().includes(location.toLowerCase())
                        )
                    );
                    
                    if (locationRows.length > 0) {
                        console.log(`  🌍 ${location} data found:`, locationRows[0]);
                    }
                });
            });
            
        } catch (error) {
            console.error(`❌ Error analyzing official ${fileType}:`, error.message);
        }
    }
}

// Compare with current system data
async function compareWithCurrentSystem() {
    console.log("\n=== COMPARING WITH CURRENT SYSTEM DATA ===");
    
    try {
        // Test current system calculation
        const response = await fetch('http://localhost:5000/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: {
                    name: "Source Validation Test",
                    country: "United Kingdom",
                    city: "London", 
                    totalArea: 1000,
                    areaUnit: "sqm",
                    currency: "USD"
                },
                budget: {
                    scope: "Complete",
                    specification: "High",
                    layout: "Activity",
                    primaryDataSource: "CBRE"
                }
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("✅ Current system calculation successful:");
            console.log(`  Fitout: $${result.fitoutCost} (${result.fitoutCost / 1000}/sqm)`);
            console.log(`  Technology: $${result.technologyCost} (${result.technologyCost / 1000}/sqm)`);
            console.log(`  Furniture: $${result.furnitureCost} (${result.furnitureCost / 1000}/sqm)`);
            console.log(`  Total: $${result.totalCost} (${result.totalCost / 1000}/sqm)`);
        } else {
            console.log("❌ Current system calculation failed");
        }
        
    } catch (error) {
        console.error("❌ Error testing current system:", error.message);
    }
}

// Generate recommendations for data source updates
function generateDataSourceRecommendations() {
    console.log("\n=== DATA SOURCE RECOMMENDATIONS ===");
    
    const recommendations = [
        "1. Update import scripts to use official CBRE Source Documents",
        "2. Verify data consistency between official sources and current system",
        "3. Implement version control for CBRE data updates",
        "4. Validate calculation accuracy against official rates",
        "5. Ensure all three components (Fitout, Technology, Furniture) use latest data"
    ];
    
    recommendations.forEach(rec => console.log(`📋 ${rec}`));
    
    return recommendations;
}

// Main execution
async function runOfficialSourceAnalysis() {
    console.log("🚀 Starting Official CBRE Source Documents Analysis");
    console.log("=" .repeat(70));
    
    try {
        await analyzeOfficialCBREDocuments();
        await compareWithCurrentSystem();
        generateDataSourceRecommendations();
        
        console.log("\n✅ Official Source Analysis Complete");
        console.log("=" .repeat(70));
        
    } catch (error) {
        console.error("❌ Analysis failed:", error);
    }
}

runOfficialSourceAnalysis();