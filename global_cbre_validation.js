// Comprehensive Global CBRE Data Validation
// Systematic validation across all countries and cities in CBRE source documents

import fs from 'fs';
import xlsx from 'xlsx';
import fetch from 'node-fetch';

console.log("=== COMPREHENSIVE GLOBAL CBRE DATA VALIDATION ===");

const cbreFiles = [
    'attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_29.01.2024_Tech Only.xlsx',
    'attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_Fitout Only.xlsx',
    'attached_assets/CBRE Source Documents/CBRE Fit Out Guide Cost Data_Furniture Only.xlsx',
    'attached_assets/CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx'
];

// Phase 1: Complete Global Location Discovery
async function discoverAllCBRELocations() {
    console.log("\n=== DISCOVERING ALL CBRE LOCATIONS ===");
    
    const allLocations = {
        countries: new Set(),
        cities: new Set(),
        regions: new Set(),
        locationDetails: []
    };
    
    for (const fileName of cbreFiles) {
        if (!fs.existsSync(fileName)) {
            console.log(`❌ File not found: ${fileName}`);
            continue;
        }
        
        console.log(`\n--- ANALYZING ${fileName} ---`);
        
        try {
            const fileData = fs.readFileSync(fileName);
            const workbook = xlsx.read(fileData, {
                cellStyles: true,
                cellFormulas: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });
            
            // Analyze each sheet for location data
            workbook.SheetNames.forEach(sheetName => {
                console.log(`  Processing sheet: ${sheetName}`);
                const sheet = workbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_json(sheet, {header: 1});
                
                // Look for location data (typically in columns B, C, D)
                sheetData.forEach((row, rowIndex) => {
                    if (row.length >= 3 && row[1] && row[2]) { // Country, City, Region
                        const country = row[1].toString().trim();
                        const city = row[2].toString().trim();
                        const region = row[3] ? row[3].toString().trim() : '';
                        
                        // Skip header rows and invalid data
                        if (country.toLowerCase() !== 'country' && 
                            city.toLowerCase() !== 'city' &&
                            !country.includes('COUNTRY') &&
                            !country.includes('$/') &&
                            country.length > 2 &&
                            city.length > 1) {
                            
                            allLocations.countries.add(country);
                            allLocations.cities.add(city);
                            if (region) allLocations.regions.add(region);
                            
                            // Extract cost data if available
                            const costData = {};
                            for (let i = 4; i < row.length; i++) {
                                if (row[i] && typeof row[i] === 'number') {
                                    costData[`col_${i}`] = row[i];
                                }
                            }
                            
                            allLocations.locationDetails.push({
                                file: fileName,
                                sheet: sheetName,
                                row: rowIndex + 1,
                                country: country,
                                city: city,
                                region: region,
                                costData: costData,
                                dataRow: row
                            });
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error(`❌ Error processing ${fileName}:`, error.message);
        }
    }
    
    // Convert Sets to Arrays and sort
    const globalLocationInventory = {
        countries: Array.from(allLocations.countries).sort(),
        cities: Array.from(allLocations.cities).sort(),
        regions: Array.from(allLocations.regions).sort(),
        totalLocations: allLocations.locationDetails.length,
        locationDetails: allLocations.locationDetails
    };
    
    console.log("\n=== GLOBAL LOCATION INVENTORY ===");
    console.log(`📊 Total Countries: ${globalLocationInventory.countries.length}`);
    console.log(`🏙️ Total Cities: ${globalLocationInventory.cities.length}`);
    console.log(`🌍 Total Regions: ${globalLocationInventory.regions.length}`);
    console.log(`📍 Total Location Records: ${globalLocationInventory.totalLocations}`);
    
    console.log("\n🌍 Countries found:");
    globalLocationInventory.countries.forEach((country, index) => {
        console.log(`  ${index + 1}. ${country}`);
    });
    
    console.log("\n🌎 Regions found:");
    globalLocationInventory.regions.forEach((region, index) => {
        console.log(`  ${index + 1}. ${region}`);
    });
    
    return globalLocationInventory;
}

// Create location-specific data mapping
function createLocationDataMapping(globalInventory) {
    console.log("\n=== CREATING LOCATION DATA MAPPING ===");
    
    const locationMapping = {};
    
    globalInventory.locationDetails.forEach(location => {
        const key = `${location.country}-${location.city}`;
        
        if (!locationMapping[key]) {
            locationMapping[key] = {
                country: location.country,
                city: location.city,
                region: location.region,
                dataSources: {},
                cityVariations: new Set([location.city])
            };
        }
        
        // Add city variation
        locationMapping[key].cityVariations.add(location.city);
        
        // Determine data type based on file name
        let dataType;
        if (location.file.includes('Tech Only')) {
            dataType = 'Technology';
        } else if (location.file.includes('Fitout Only')) {
            dataType = 'Fitout';
        } else if (location.file.includes('Furniture Only')) {
            dataType = 'Furniture';
        } else {
            dataType = 'Combined';
        }
        
        if (!locationMapping[key].dataSources[dataType]) {
            locationMapping[key].dataSources[dataType] = [];
        }
        
        locationMapping[key].dataSources[dataType].push({
            file: location.file,
            sheet: location.sheet,
            row: location.row,
            costData: location.costData,
            dataRow: location.dataRow
        });
    });
    
    // Convert Sets to Arrays
    Object.keys(locationMapping).forEach(key => {
        locationMapping[key].cityVariations = Array.from(locationMapping[key].cityVariations);
    });
    
    console.log(`📊 Location mapping created for ${Object.keys(locationMapping).length} unique locations`);
    return locationMapping;
}

// Analyze regional coverage and data completeness
function analyzeRegionalCoverage(locationMapping) {
    console.log("\n=== ANALYZING REGIONAL COVERAGE ===");
    
    const regionalAnalysis = {};
    
    Object.values(locationMapping).forEach(location => {
        const region = location.region || 'Unknown';
        
        if (!regionalAnalysis[region]) {
            regionalAnalysis[region] = {
                countries: new Set(),
                cities: new Set(),
                locations: [],
                dataCompleteness: {
                    technology: 0,
                    fitout: 0,
                    furniture: 0,
                    combined: 0
                }
            };
        }
        
        regionalAnalysis[region].countries.add(location.country);
        regionalAnalysis[region].cities.add(location.city);
        regionalAnalysis[region].locations.push(location);
        
        // Check data completeness
        Object.keys(location.dataSources).forEach(dataType => {
            const key = dataType.toLowerCase();
            if (regionalAnalysis[region].dataCompleteness.hasOwnProperty(key)) {
                regionalAnalysis[region].dataCompleteness[key]++;
            }
        });
    });
    
    // Convert Sets to Arrays for final output
    Object.keys(regionalAnalysis).forEach(region => {
        regionalAnalysis[region].countries = Array.from(regionalAnalysis[region].countries);
        regionalAnalysis[region].cities = Array.from(regionalAnalysis[region].cities);
        
        console.log(`\n--- REGION: ${region} ---`);
        console.log(`  Countries: ${regionalAnalysis[region].countries.length}`);
        console.log(`  Cities: ${regionalAnalysis[region].cities.length}`);
        console.log(`  Locations: ${regionalAnalysis[region].locations.length}`);
        console.log(`  Data Completeness:`, regionalAnalysis[region].dataCompleteness);
        
        // Show countries in this region
        console.log(`  Countries in ${region}:`, regionalAnalysis[region].countries.join(', '));
    });
    
    return regionalAnalysis;
}

// Identify data gaps and inconsistencies
function identifyDataGaps(locationMapping) {
    console.log("\n=== IDENTIFYING DATA GAPS ===");
    
    const dataGaps = {
        missingTechnology: [],
        missingFitout: [],
        missingFurniture: [],
        incomplete: [],
        complete: []
    };
    
    Object.entries(locationMapping).forEach(([locationKey, location]) => {
        const dataSources = location.dataSources;
        const availableTypes = Object.keys(dataSources);
        
        if (!dataSources.Technology) {
            dataGaps.missingTechnology.push(locationKey);
        }
        if (!dataSources.Fitout) {
            dataGaps.missingFitout.push(locationKey);
        }
        if (!dataSources.Furniture) {
            dataGaps.missingFurniture.push(locationKey);
        }
        
        const requiredTypes = ['Technology', 'Fitout', 'Furniture'];
        const hasAllRequired = requiredTypes.every(type => dataSources[type]);
        
        if (hasAllRequired) {
            dataGaps.complete.push({
                location: locationKey,
                available: availableTypes,
                dataCount: availableTypes.reduce((sum, type) => sum + dataSources[type].length, 0)
            });
        } else {
            dataGaps.incomplete.push({
                location: locationKey,
                available: availableTypes,
                missing: requiredTypes.filter(type => !dataSources[type])
            });
        }
    });
    
    console.log("\n📊 Data Gaps Analysis:");
    console.log(`❌ Missing Technology data: ${dataGaps.missingTechnology.length} locations`);
    console.log(`❌ Missing Fitout data: ${dataGaps.missingFitout.length} locations`);
    console.log(`❌ Missing Furniture data: ${dataGaps.missingFurniture.length} locations`);
    console.log(`⚠️ Incomplete locations: ${dataGaps.incomplete.length} locations`);
    console.log(`✅ Complete locations: ${dataGaps.complete.length} locations`);
    
    if (dataGaps.complete.length > 0) {
        console.log("\n✅ Locations with Complete Data Coverage:");
        dataGaps.complete.slice(0, 10).forEach(item => {
            console.log(`  ${item.location}: ${item.available.join(', ')} (${item.dataCount} records)`);
        });
        if (dataGaps.complete.length > 10) {
            console.log(`  ... and ${dataGaps.complete.length - 10} more`);
        }
    }
    
    if (dataGaps.incomplete.length > 0) {
        console.log("\n⚠️ Incomplete Locations (showing first 10):");
        dataGaps.incomplete.slice(0, 10).forEach(item => {
            console.log(`  ${item.location}: Missing ${item.missing.join(', ')}`);
        });
        if (dataGaps.incomplete.length > 10) {
            console.log(`  ... and ${dataGaps.incomplete.length - 10} more incomplete locations`);
        }
    }
    
    return dataGaps;
}

// Test system calculation for multiple global locations
async function testGlobalSystemCalculations(locationMapping, dataGaps) {
    console.log("\n=== TESTING GLOBAL SYSTEM CALCULATIONS ===");
    
    const testLocations = dataGaps.complete.slice(0, 5); // Test top 5 complete locations
    const specifications = ['Low', 'Medium', 'High'];
    const results = [];
    
    for (const locationInfo of testLocations) {
        const [country, city] = locationInfo.location.split('-');
        
        console.log(`\n--- Testing: ${city}, ${country} ---`);
        
        for (const spec of specifications) {
            try {
                const response = await fetch('http://localhost:5000/api/calculate-budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project: {
                            name: `Global Test ${city}`,
                            country: country,
                            city: city,
                            totalArea: 1000,
                            areaUnit: "sqm",
                            currency: "USD"
                        },
                        budget: {
                            scope: "Complete",
                            specification: spec,
                            layout: "Activity",
                            primaryDataSource: "CBRE"
                        }
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    results.push({
                        location: `${city}, ${country}`,
                        specification: spec,
                        success: true,
                        totalCost: result.totalCost,
                        fitout: result.fitoutCost,
                        technology: result.technologyCost,
                        furniture: result.furnitureCost,
                        unitCost: result.totalCost / 1000
                    });
                    
                    console.log(`  ✅ ${spec}: $${result.totalCost.toLocaleString()} total ($${(result.totalCost/1000).toFixed(2)}/sqm)`);
                } else {
                    results.push({
                        location: `${city}, ${country}`,
                        specification: spec,
                        success: false,
                        error: `HTTP ${response.status}`
                    });
                    console.log(`  ❌ ${spec}: Failed - HTTP ${response.status}`);
                }
                
            } catch (error) {
                results.push({
                    location: `${city}, ${country}`,
                    specification: spec,
                    success: false,
                    error: error.message
                });
                console.log(`  ❌ ${spec}: Error - ${error.message}`);
            }
        }
    }
    
    // Calculate success rate
    const successfulTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    const successRate = (successfulTests / totalTests * 100).toFixed(1);
    
    console.log(`\n📊 Global Calculation Test Results:`);
    console.log(`  Total tests: ${totalTests}`);
    console.log(`  Successful: ${successfulTests}`);
    console.log(`  Failed: ${totalTests - successfulTests}`);
    console.log(`  Success rate: ${successRate}%`);
    
    return results;
}

// Generate comprehensive validation report
function generateValidationReport(globalInventory, locationMapping, regionalAnalysis, dataGaps, testResults) {
    console.log("\n=== COMPREHENSIVE VALIDATION REPORT ===");
    
    const report = {
        summary: {
            totalCountries: globalInventory.countries.length,
            totalCities: globalInventory.cities.length,
            totalRegions: globalInventory.regions.length,
            totalLocationRecords: globalInventory.totalLocations,
            uniqueLocations: Object.keys(locationMapping).length,
            completeLocations: dataGaps.complete.length,
            incompleteLocations: dataGaps.incomplete.length,
            systemTestSuccessRate: testResults ? (testResults.filter(r => r.success).length / testResults.length * 100).toFixed(1) + '%' : 'N/A'
        },
        coverage: {
            regions: Object.keys(regionalAnalysis),
            topCountriesByLocations: globalInventory.countries.slice(0, 10),
            dataCompleteness: {
                complete: dataGaps.complete.length,
                incomplete: dataGaps.incomplete.length,
                completenessRate: (dataGaps.complete.length / Object.keys(locationMapping).length * 100).toFixed(1) + '%'
            }
        },
        recommendations: []
    };
    
    console.log("\n📊 GLOBAL VALIDATION SUMMARY:");
    console.log(`  Countries: ${report.summary.totalCountries}`);
    console.log(`  Cities: ${report.summary.totalCities}`);
    console.log(`  Regions: ${report.summary.totalRegions}`);
    console.log(`  Location Records: ${report.summary.totalLocationRecords}`);
    console.log(`  Unique Locations: ${report.summary.uniqueLocations}`);
    console.log(`  Complete Coverage: ${report.summary.completeLocations} (${report.coverage.dataCompleteness.completenessRate})`);
    console.log(`  System Test Success: ${report.summary.systemTestSuccessRate}`);
    
    // Generate recommendations
    if (dataGaps.incomplete.length > 0) {
        report.recommendations.push("Address missing data for incomplete locations");
    }
    if (testResults && testResults.some(r => !r.success)) {
        report.recommendations.push("Investigate failed system calculations");
    }
    if (report.summary.totalCountries > 50) {
        report.recommendations.push("Consider data regionalization for performance optimization");
    }
    
    console.log("\n📋 Recommendations:");
    report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
    });
    
    return report;
}

// Main execution function
async function runGlobalCBREValidation() {
    console.log("🚀 Starting Comprehensive Global CBRE Data Validation");
    console.log("=" .repeat(80));
    
    try {
        // Phase 1: Location Discovery
        const globalInventory = await discoverAllCBRELocations();
        
        // Phase 2: Data Mapping
        const locationMapping = createLocationDataMapping(globalInventory);
        
        // Phase 3: Regional Analysis
        const regionalAnalysis = analyzeRegionalCoverage(locationMapping);
        
        // Phase 4: Gap Analysis
        const dataGaps = identifyDataGaps(locationMapping);
        
        // Phase 5: System Testing
        const testResults = await testGlobalSystemCalculations(locationMapping, dataGaps);
        
        // Phase 6: Final Report
        const validationReport = generateValidationReport(
            globalInventory, 
            locationMapping, 
            regionalAnalysis, 
            dataGaps, 
            testResults
        );
        
        console.log("\n✅ Global CBRE Data Validation Complete");
        console.log("=" .repeat(80));
        
        return validationReport;
        
    } catch (error) {
        console.error("❌ Global validation failed:", error);
        throw error;
    }
}

// Execute the global validation
runGlobalCBREValidation();