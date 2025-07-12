/**
 * T&T Source Document Validation
 * Validates system extracted rates against actual T&T source document values
 */

console.log("=== T&T SOURCE DOCUMENT VALIDATION ===");

// Actual T&T source document data from the images (in £/sqft - need to convert to USD/sqm)
const TT_SOURCE_DATA = {
    // EMEA Region (Image 1)
    "France/Paris": {
        totalCost: { low: 208.47, medium: 255.77, high: 372.87 },
        construction: { low: 164.52, medium: 207.33, high: 286.92 },
        looseFurniture: { low: 20.49, medium: 29.26, high: 46.82 },
        audioVisual: { low: 7.33, medium: 8.78, high: 10.73 },
        professionalFees: { low: 16.14, medium: 20.39, high: 28.39 }
    },
    "Germany/Munich": {
        totalCost: { low: 250.86, medium: 296.62, high: 384.34 },
        construction: { low: 188.51, medium: 235.83, high: 306.69 },
        looseFurniture: { low: 15.71, medium: 17.41, high: 19.12 },
        audioVisual: { low: 3.51, medium: 3.90, high: 4.88 },
        professionalFees: { low: 33.22, medium: 39.48, high: 51.65 }
    },
    "United Kingdom/London": {
        totalCost: { low: 329.63, medium: 402.26, high: 551.50 },
        construction: { low: 235.32, medium: 278.02, high: 381.53 },
        looseFurniture: { low: 35.40, medium: 53.09, high: 70.79 },
        audioVisual: { low: 20.06, medium: 24.78, high: 34.22 },
        professionalFees: { low: 39.06, medium: 46.37, high: 64.95 }
    },
    
    // AMERICAS Region (Image 2)
    "Canada/Toronto": {
        totalCost: { low: 195.97, medium: 242.63, high: 305.30 },
        construction: { low: 135.18, medium: 170.95, high: 222.94 },
        looseFurniture: { low: 39.89, medium: 45.07, high: 49.65 },
        audioVisual: { low: 11.64, medium: 14.94, high: 17.38 },
        professionalFees: { low: 9.26, medium: 13.70, high: 15.32 }
    },
    "Canada/Vancouver": {
        totalCost: { low: 195.85, medium: 242.71, high: 311.28 },
        construction: { low: 142.59, medium: 173.63, high: 228.23 },
        looseFurniture: { low: 31.49, medium: 42.99, high: 50.97 },
        audioVisual: { low: 12.11, medium: 14.31, high: 16.54 },
        professionalFees: { low: 9.67, medium: 11.76, high: 15.55 }
    },
    "United States/New York": {
        totalCost: { low: 332.79, medium: 410.70, high: 527.37 },
        construction: { low: 266.87, medium: 333.73, high: 432.65 },
        looseFurniture: { low: 34.99, medium: 38.49, high: 44.26 },
        audioVisual: { low: 19.00, medium: 14.63, high: 19.77 },
        professionalFees: { low: 18.93, medium: 23.86, high: 30.69 }
    }
};

// Conversion factors
const SQFT_TO_SQM = 10.764;
const GBP_TO_USD = 1.27; // Approximate rate

function convertTTSourceToSystemFormat(sourceData) {
    const converted = {};
    
    Object.entries(sourceData).forEach(([location, data]) => {
        converted[location] = {
            totalCost: {
                low: Math.round(data.totalCost.low * SQFT_TO_SQM * GBP_TO_USD),
                medium: Math.round(data.totalCost.medium * SQFT_TO_SQM * GBP_TO_USD),
                high: Math.round(data.totalCost.high * SQFT_TO_SQM * GBP_TO_USD)
            },
            construction: {
                low: Math.round(data.construction.low * SQFT_TO_SQM * GBP_TO_USD),
                medium: Math.round(data.construction.medium * SQFT_TO_SQM * GBP_TO_USD),
                high: Math.round(data.construction.high * SQFT_TO_SQM * GBP_TO_USD)
            },
            looseFurniture: {
                low: Math.round(data.looseFurniture.low * SQFT_TO_SQM * GBP_TO_USD),
                medium: Math.round(data.looseFurniture.medium * SQFT_TO_SQM * GBP_TO_USD),
                high: Math.round(data.looseFurniture.high * SQFT_TO_SQM * GBP_TO_USD)
            },
            audioVisual: {
                low: Math.round(data.audioVisual.low * SQFT_TO_SQM * GBP_TO_USD),
                medium: Math.round(data.audioVisual.medium * SQFT_TO_SQM * GBP_TO_USD),
                high: Math.round(data.audioVisual.high * SQFT_TO_SQM * GBP_TO_USD)
            },
            professionalFees: {
                low: Math.round(data.professionalFees.low * SQFT_TO_SQM * GBP_TO_USD),
                medium: Math.round(data.professionalFees.medium * SQFT_TO_SQM * GBP_TO_USD),
                high: Math.round(data.professionalFees.high * SQFT_TO_SQM * GBP_TO_USD)
            }
        };
    });
    
    return converted;
}

async function validateSystemAgainstSourceData() {
    console.log("Converting T&T source document data to system format...");
    const expectedData = convertTTSourceToSystemFormat(TT_SOURCE_DATA);
    
    console.log("\nExpected data from source documents:");
    console.log(JSON.stringify(expectedData, null, 2));
    
    console.log("\n=== SYSTEM VS SOURCE VALIDATION ===");
    
    const validationResults = [];
    
    for (const [location, expectedRates] of Object.entries(expectedData)) {
        const [country, city] = location.split('/');
        console.log(`\n--- Validating ${location} ---`);
        
        try {
            // Test Medium specification
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        city: city,
                        country: country,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        primaryDataSource: "TT",
                        scope: "Complete",
                        specification: "Medium (Silver)",
                        layout: "Activity"
                    }
                })
            });
            
            if (response.ok) {
                const systemResult = await response.json();
                const systemRates = {
                    totalCost: systemResult.rawUnitCost,
                    construction: Math.round(systemResult.costsBreakdown.Construction / 1000),
                    looseFurniture: Math.round(systemResult.costsBreakdown['Loose Furniture'] / 1000),
                    audioVisual: Math.round(systemResult.costsBreakdown['Audio-Visual'] / 1000),
                    professionalFees: Math.round(systemResult.costsBreakdown['Professional Fees'] / 1000)
                };
                
                const expectedRatesM = expectedRates.totalCost.medium;
                const actualRate = systemRates.totalCost;
                const variance = Math.abs(actualRate - expectedRatesM);
                const variancePercent = (variance / expectedRatesM) * 100;
                
                validationResults.push({
                    location: location,
                    expected: expectedRatesM,
                    actual: actualRate,
                    variance: variance,
                    variancePercent: variancePercent,
                    withinTolerance: variancePercent <= 15,
                    systemRates: systemRates,
                    expectedRates: expectedRates
                });
                
                console.log(`Expected (from source): ${expectedRatesM}/sqm`);
                console.log(`System extracted: ${actualRate}/sqm`);
                console.log(`Variance: ${variance}/sqm (${variancePercent.toFixed(1)}%)`);
                console.log(`Status: ${variancePercent <= 15 ? '✅ WITHIN TOLERANCE' : '❌ OUTSIDE TOLERANCE'}`);
                
                // Show component breakdown comparison
                console.log(`Component comparison:`);
                console.log(`  Construction: Expected ${expectedRates.construction.medium}, Got ${systemRates.construction}`);
                console.log(`  Loose Furniture: Expected ${expectedRates.looseFurniture.medium}, Got ${systemRates.looseFurniture}`);
                console.log(`  Audio-Visual: Expected ${expectedRates.audioVisual.medium}, Got ${systemRates.audioVisual}`);
                console.log(`  Professional Fees: Expected ${expectedRates.professionalFees.medium}, Got ${systemRates.professionalFees}`);
                
            } else {
                validationResults.push({
                    location: location,
                    error: `HTTP ${response.status}`,
                    withinTolerance: false
                });
                console.log(`❌ System validation failed: HTTP ${response.status}`);
            }
            
        } catch (error) {
            validationResults.push({
                location: location,
                error: error.message,
                withinTolerance: false
            });
            console.log(`❌ System validation error: ${error.message}`);
        }
    }
    
    return validationResults;
}

async function generateValidationReport(results) {
    console.log("\n=== T&T SOURCE DOCUMENT VALIDATION REPORT ===");
    
    const successfulValidations = results.filter(r => r.withinTolerance);
    const failedValidations = results.filter(r => !r.withinTolerance);
    
    console.log(`\nValidation Summary:`);
    console.log(`Total locations tested: ${results.length}`);
    console.log(`Within tolerance (±15%): ${successfulValidations.length}`);
    console.log(`Outside tolerance: ${failedValidations.length}`);
    console.log(`Success rate: ${((successfulValidations.length / results.length) * 100).toFixed(1)}%`);
    
    if (successfulValidations.length > 0) {
        console.log(`\n✅ SUCCESSFUL VALIDATIONS:`);
        successfulValidations.forEach(result => {
            console.log(`  ${result.location}: ${result.variancePercent.toFixed(1)}% variance`);
        });
    }
    
    if (failedValidations.length > 0) {
        console.log(`\n❌ FAILED VALIDATIONS:`);
        failedValidations.forEach(result => {
            if (result.error) {
                console.log(`  ${result.location}: ${result.error}`);
            } else {
                console.log(`  ${result.location}: ${result.variancePercent.toFixed(1)}% variance (exceeds ±15% tolerance)`);
            }
        });
    }
    
    console.log(`\n=== CONCLUSION ===`);
    if (successfulValidations.length >= results.length * 0.8) {
        console.log(`✅ T&T system validation PASSED`);
        console.log(`System rates are consistent with source document data`);
    } else {
        console.log(`❌ T&T system validation FAILED`);
        console.log(`System rates deviate significantly from source document data`);
    }
    
    return {
        totalTested: results.length,
        successful: successfulValidations.length,
        failed: failedValidations.length,
        successRate: (successfulValidations.length / results.length) * 100,
        passed: successfulValidations.length >= results.length * 0.8
    };
}

async function runSourceDocumentValidation() {
    console.log("Starting T&T source document validation...");
    console.log("Comparing system extracted rates with actual T&T source document values");
    
    const validationResults = await validateSystemAgainstSourceData();
    const report = await generateValidationReport(validationResults);
    
    return {
        validationResults,
        report
    };
}

// Execute validation
runSourceDocumentValidation().catch(console.error);