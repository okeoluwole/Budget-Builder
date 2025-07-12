/**
 * T&T Comprehensive Source Document Validation
 * Complete validation of T&T system against actual source document data
 * Using manual extraction from PDF to validate system accuracy
 */

console.log("=== T&T COMPREHENSIVE SOURCE DOCUMENT VALIDATION ===");

// Based on the PDF extraction output, I can see cost data patterns
// Let me create a comprehensive validation using the actual T&T data structure

// T&T Source Document Data (manually extracted from PDF analysis)
// Converting from various units to USD/sqm for consistency
const TT_SOURCE_DOCUMENT_DATA = {
    "France/Paris": {
        // From PDF table data showing costs in £/sqft, converted to USD/sqm
        construction: { low: 1843, medium: 2245, high: 3108 },
        looseFurniture: { low: 280, medium: 399, high: 639 },
        audioVisual: { low: 100, medium: 120, high: 147 },
        professionalFees: { low: 221, medium: 279, high: 388 },
        totalCost: { low: 2444, medium: 3043, high: 4282 }
    },
    "Germany/Munich": {
        construction: { low: 2577, medium: 3224, high: 4193 },
        looseFurniture: { low: 215, medium: 238, high: 261 },
        audioVisual: { low: 48, medium: 53, high: 67 },
        professionalFees: { low: 454, medium: 540, high: 706 },
        totalCost: { low: 3294, medium: 4055, high: 5227 }
    },
    "Canada/Toronto": {
        construction: { low: 1848, medium: 2337, high: 3048 },
        looseFurniture: { low: 545, medium: 616, high: 679 },
        audioVisual: { low: 159, medium: 204, high: 238 },
        professionalFees: { low: 127, medium: 187, high: 209 },
        totalCost: { low: 2679, medium: 3344, high: 4174 }
    },
    "Canada/Vancouver": {
        construction: { low: 1949, medium: 2374, high: 3120 },
        looseFurniture: { low: 430, medium: 588, high: 697 },
        audioVisual: { low: 166, medium: 196, high: 226 },
        professionalFees: { low: 132, medium: 161, high: 213 },
        totalCost: { low: 2677, medium: 3319, high: 4256 }
    },
    "United Kingdom/London": {
        construction: { low: 3217, medium: 3801, high: 5216 },
        looseFurniture: { low: 484, medium: 726, high: 968 },
        audioVisual: { low: 274, medium: 339, high: 468 },
        professionalFees: { low: 534, medium: 634, high: 888 },
        totalCost: { low: 4509, medium: 5500, high: 7540 }
    },
    "United States/New York": {
        construction: { low: 3648, medium: 4562, high: 5920 },
        looseFurniture: { low: 478, medium: 526, high: 605 },
        audioVisual: { low: 206, medium: 200, high: 270 },
        professionalFees: { low: 259, medium: 326, high: 419 },
        totalCost: { low: 4591, medium: 5614, high: 7214 }
    },
    "Singapore/Singapore": {
        construction: { low: 1980, medium: 2288, high: 2981 },
        looseFurniture: { low: 277, medium: 343, high: 429 },
        audioVisual: { low: 178, medium: 201, high: 258 },
        professionalFees: { low: 315, medium: 368, high: 484 },
        totalCost: { low: 2750, medium: 3200, high: 4152 }
    }
};

// Current system data for comparison
const CURRENT_SYSTEM_DATA = {
    "France/Paris": {
        construction: 2232, looseFurniture: 315, audioVisual: 95, professionalFees: 220, totalCost: 2862
    },
    "Germany/Munich": {
        construction: 2540, looseFurniture: 187, audioVisual: 42, professionalFees: 425, totalCost: 3194
    },
    "Canada/Toronto": {
        construction: 2275, looseFurniture: 325, audioVisual: 228, professionalFees: 423, totalCost: 3251
    },
    "Canada/Vancouver": {
        construction: 2205, looseFurniture: 315, audioVisual: 221, professionalFees: 410, totalCost: 3151
    },
    "United Kingdom/London": {
        construction: 2992, looseFurniture: 572, audioVisual: 267, professionalFees: 499, totalCost: 4330
    },
    "United States/New York": {
        construction: 3640, looseFurniture: 520, audioVisual: 364, professionalFees: 676, totalCost: 5200
    },
    "Singapore/Singapore": {
        construction: 2080, looseFurniture: 312, audioVisual: 182, professionalFees: 326, totalCost: 2900
    }
};

async function validateSystemAgainstSourceDocument() {
    console.log("Starting comprehensive T&T source document validation...");
    
    const validationResults = [];
    const componentValidations = [];
    
    console.log("\n=== DETAILED LOCATION VALIDATION ===");
    
    for (const [location, sourceData] of Object.entries(TT_SOURCE_DOCUMENT_DATA)) {
        console.log(`\n--- Validating ${location} ---`);
        
        const systemData = CURRENT_SYSTEM_DATA[location];
        
        if (!systemData) {
            console.log(`❌ ${location} not found in system data`);
            continue;
        }
        
        // Validate total cost (Medium specification)
        const sourceTotal = sourceData.totalCost.medium;
        const systemTotal = systemData.totalCost;
        const totalVariance = Math.abs(systemTotal - sourceTotal);
        const totalVariancePercent = (totalVariance / sourceTotal) * 100;
        
        console.log(`Source total (Medium): ${sourceTotal}/sqm`);
        console.log(`System total: ${systemTotal}/sqm`);
        console.log(`Variance: ${totalVariance}/sqm (${totalVariancePercent.toFixed(1)}%)`);
        
        const locationResult = {
            location: location,
            sourceTotal: sourceTotal,
            systemTotal: systemTotal,
            totalVariance: totalVariance,
            totalVariancePercent: totalVariancePercent,
            withinTolerance: totalVariancePercent <= 15,
            components: {}
        };
        
        // Validate individual components
        const components = ['construction', 'looseFurniture', 'audioVisual', 'professionalFees'];
        
        for (const component of components) {
            const sourceValue = sourceData[component].medium;
            const systemValue = systemData[component];
            const componentVariance = Math.abs(systemValue - sourceValue);
            const componentVariancePercent = (componentVariance / sourceValue) * 100;
            
            console.log(`  ${component}: Source ${sourceValue}, System ${systemValue}, Variance ${componentVariancePercent.toFixed(1)}%`);
            
            locationResult.components[component] = {
                source: sourceValue,
                system: systemValue,
                variance: componentVariance,
                variancePercent: componentVariancePercent,
                withinTolerance: componentVariancePercent <= 25 // More lenient for components
            };
            
            componentValidations.push({
                location: location,
                component: component,
                variancePercent: componentVariancePercent,
                withinTolerance: componentVariancePercent <= 25
            });
        }
        
        console.log(`Overall result: ${locationResult.withinTolerance ? '✅ WITHIN TOLERANCE' : '❌ OUTSIDE TOLERANCE'}`);
        validationResults.push(locationResult);
    }
    
    return { validationResults, componentValidations };
}

async function testSystemAPI() {
    console.log("\n=== TESTING SYSTEM API INTEGRATION ===");
    
    const apiResults = [];
    
    for (const [location, sourceData] of Object.entries(TT_SOURCE_DOCUMENT_DATA)) {
        const [country, city] = location.split('/');
        
        console.log(`\nTesting ${location} via API...`);
        
        try {
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
                const apiResult = await response.json();
                const apiTotal = apiResult.rawUnitCost;
                const sourceTotal = sourceData.totalCost.medium;
                const apiVariance = Math.abs(apiTotal - sourceTotal);
                const apiVariancePercent = (apiVariance / sourceTotal) * 100;
                
                apiResults.push({
                    location: location,
                    success: true,
                    apiTotal: apiTotal,
                    sourceTotal: sourceTotal,
                    variance: apiVariance,
                    variancePercent: apiVariancePercent,
                    withinTolerance: apiVariancePercent <= 15,
                    breakdown: apiResult.costsBreakdown
                });
                
                console.log(`✅ API success: ${apiTotal}/sqm vs source ${sourceTotal}/sqm (${apiVariancePercent.toFixed(1)}% variance)`);
            } else {
                apiResults.push({
                    location: location,
                    success: false,
                    error: `HTTP ${response.status}`
                });
                console.log(`❌ API failed: HTTP ${response.status}`);
            }
        } catch (error) {
            apiResults.push({
                location: location,
                success: false,
                error: error.message
            });
            console.log(`❌ API error: ${error.message}`);
        }
    }
    
    return apiResults;
}

function generateComprehensiveReport(validationResults, componentValidations, apiResults) {
    console.log("\n=== COMPREHENSIVE T&T SOURCE VALIDATION REPORT ===");
    
    const totalLocations = validationResults.length;
    const successfulValidations = validationResults.filter(r => r.withinTolerance);
    const failedValidations = validationResults.filter(r => !r.withinTolerance);
    
    const successfulAPIs = apiResults.filter(r => r.success);
    const failedAPIs = apiResults.filter(r => !r.success);
    
    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`Total locations tested: ${totalLocations}`);
    console.log(`Static validation within tolerance: ${successfulValidations.length}`);
    console.log(`Static validation outside tolerance: ${failedValidations.length}`);
    console.log(`API calls successful: ${successfulAPIs.length}`);
    console.log(`API calls failed: ${failedAPIs.length}`);
    
    const staticSuccessRate = (successfulValidations.length / totalLocations) * 100;
    const apiSuccessRate = (successfulAPIs.length / totalLocations) * 100;
    
    console.log(`Static validation success rate: ${staticSuccessRate.toFixed(1)}%`);
    console.log(`API integration success rate: ${apiSuccessRate.toFixed(1)}%`);
    
    if (successfulValidations.length > 0) {
        console.log(`\n✅ SUCCESSFUL VALIDATIONS (Total Cost):`);
        successfulValidations.forEach(result => {
            console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance`);
        });
    }
    
    if (failedValidations.length > 0) {
        console.log(`\n❌ FAILED VALIDATIONS (Total Cost):`);
        failedValidations.forEach(result => {
            console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance`);
            
            // Show which components are problematic
            const problemComponents = Object.entries(result.components)
                .filter(([comp, data]) => !data.withinTolerance)
                .map(([comp, data]) => `${comp}(${data.variancePercent.toFixed(1)}%)`);
            
            if (problemComponents.length > 0) {
                console.log(`    Problem components: ${problemComponents.join(', ')}`);
            }
        });
    }
    
    // Component analysis
    const componentStats = {};
    componentValidations.forEach(cv => {
        if (!componentStats[cv.component]) {
            componentStats[cv.component] = { total: 0, successful: 0, variances: [] };
        }
        componentStats[cv.component].total++;
        if (cv.withinTolerance) {
            componentStats[cv.component].successful++;
        }
        componentStats[cv.component].variances.push(cv.variancePercent);
    });
    
    console.log(`\n📈 COMPONENT ANALYSIS:`);
    Object.entries(componentStats).forEach(([component, stats]) => {
        const avgVariance = stats.variances.reduce((a, b) => a + b, 0) / stats.variances.length;
        const successRate = (stats.successful / stats.total) * 100;
        console.log(`  ${component}: ${stats.successful}/${stats.total} within tolerance (${successRate.toFixed(1)}%, avg variance: ${avgVariance.toFixed(1)}%)`);
    });
    
    console.log(`\n=== FINAL CONCLUSION ===`);
    if (staticSuccessRate >= 80 && apiSuccessRate >= 80) {
        console.log(`✅ T&T SOURCE VALIDATION PASSED`);
        console.log(`System data is consistent with source document`);
    } else if (staticSuccessRate >= 60 || apiSuccessRate >= 60) {
        console.log(`⚠️  T&T SOURCE VALIDATION PARTIAL`);
        console.log(`System data has some inconsistencies with source document`);
    } else {
        console.log(`❌ T&T SOURCE VALIDATION FAILED`);
        console.log(`System data significantly deviates from source document`);
    }
    
    return {
        totalLocations,
        staticSuccessRate,
        apiSuccessRate,
        successfulValidations: successfulValidations.length,
        failedValidations: failedValidations.length,
        componentStats,
        overallPassed: staticSuccessRate >= 80 && apiSuccessRate >= 80
    };
}

async function runComprehensiveValidation() {
    console.log("Running comprehensive T&T source document validation...");
    
    // Step 1: Validate system data against source document
    const { validationResults, componentValidations } = await validateSystemAgainstSourceDocument();
    
    // Step 2: Test system API integration
    const apiResults = await testSystemAPI();
    
    // Step 3: Generate comprehensive report
    const report = generateComprehensiveReport(validationResults, componentValidations, apiResults);
    
    // Save results
    const finalResults = {
        sourceDocumentData: TT_SOURCE_DOCUMENT_DATA,
        systemData: CURRENT_SYSTEM_DATA,
        validationResults,
        componentValidations,
        apiResults,
        report,
        timestamp: new Date().toISOString()
    };
    
    console.log(`\n💾 Saving comprehensive validation results...`);
    
    // Note: In a real environment, you would save to a file
    // For now, we'll just show the summary
    
    return finalResults;
}

// Execute the validation
runComprehensiveValidation().catch(console.error);