/**
 * STEP 8: Re-run Comprehensive T&T Validation
 * Test updated system against PDF source document with live API calls
 */

console.log("=== STEP 8: RE-RUNNING COMPREHENSIVE T&T VALIDATION ===");

// PDF source document target rates (from comprehensive validation)
const PDF_SOURCE_RATES = {
    "France/Paris": {
        construction: 2245, looseFurniture: 399, audioVisual: 120, professionalFees: 279, totalCost: 3043
    },
    "Germany/Munich": {
        construction: 3224, looseFurniture: 238, audioVisual: 53, professionalFees: 540, totalCost: 4055
    },
    "Canada/Toronto": {
        construction: 2337, looseFurniture: 616, audioVisual: 204, professionalFees: 187, totalCost: 3344
    },
    "Canada/Vancouver": {
        construction: 2374, looseFurniture: 588, audioVisual: 196, professionalFees: 161, totalCost: 3319
    },
    "United Kingdom/London": {
        construction: 3801, looseFurniture: 726, audioVisual: 339, professionalFees: 634, totalCost: 5500
    },
    "United States/New York": {
        construction: 4562, looseFurniture: 526, audioVisual: 200, professionalFees: 326, totalCost: 5614
    },
    "Singapore/Singapore": {
        construction: 2288, looseFurniture: 343, audioVisual: 201, professionalFees: 368, totalCost: 3200
    }
};

async function rerunComprehensiveValidation() {
    console.log("Re-validating T&T system after rate adjustments...");
    
    const validationResults = [];
    
    console.log("\n=== LIVE API VALIDATION ===");
    
    for (const [location, sourceData] of Object.entries(PDF_SOURCE_RATES)) {
        const [country, city] = location.split('/');
        
        console.log(`\n--- Testing ${location} ---`);
        
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
                const systemTotal = apiResult.rawUnitCost;
                const breakdown = apiResult.costsBreakdown;
                
                // Calculate variance
                const sourceTotal = sourceData.totalCost;
                const totalVariance = Math.abs(systemTotal - sourceTotal);
                const totalVariancePercent = (totalVariance / sourceTotal) * 100;
                
                console.log(`API Total: ${systemTotal}/sqm`);
                console.log(`PDF Source: ${sourceTotal}/sqm`);
                console.log(`Variance: ${totalVariance}/sqm (${totalVariancePercent.toFixed(1)}%)`);
                
                // Component analysis
                const systemBreakdown = {
                    construction: Math.round(breakdown.Construction / 1000),
                    looseFurniture: Math.round(breakdown['Loose Furniture'] / 1000),
                    audioVisual: Math.round(breakdown['Audio-Visual'] / 1000),
                    professionalFees: Math.round(breakdown['Professional Fees'] / 1000)
                };
                
                const componentResults = {};
                Object.entries(systemBreakdown).forEach(([component, systemValue]) => {
                    const sourceValue = sourceData[component];
                    const componentVariance = Math.abs(systemValue - sourceValue);
                    const componentVariancePercent = (componentVariance / sourceValue) * 100;
                    
                    componentResults[component] = {
                        system: systemValue,
                        source: sourceValue,
                        variance: componentVariance,
                        variancePercent: componentVariancePercent,
                        withinTolerance: componentVariancePercent <= 25
                    };
                    
                    console.log(`  ${component}: ${systemValue} vs ${sourceValue} (${componentVariancePercent.toFixed(1)}%)`);
                });
                
                const withinTolerance = totalVariancePercent <= 15;
                console.log(`Result: ${withinTolerance ? '✅ WITHIN TOLERANCE' : '❌ OUTSIDE TOLERANCE'}`);
                
                validationResults.push({
                    location: location,
                    success: true,
                    systemTotal: systemTotal,
                    sourceTotal: sourceTotal,
                    totalVariance: totalVariance,
                    totalVariancePercent: totalVariancePercent,
                    withinTolerance: withinTolerance,
                    componentResults: componentResults
                });
                
            } else {
                console.log(`❌ API failed: HTTP ${response.status}`);
                validationResults.push({
                    location: location,
                    success: false,
                    error: `HTTP ${response.status}`
                });
            }
        } catch (error) {
            console.log(`❌ API error: ${error.message}`);
            validationResults.push({
                location: location,
                success: false,
                error: error.message
            });
        }
    }
    
    return validationResults;
}

function generateUpdatedValidationReport(validationResults) {
    console.log("\n=== UPDATED VALIDATION REPORT ===");
    
    const successfulAPIs = validationResults.filter(r => r.success);
    const failedAPIs = validationResults.filter(r => !r.success);
    const successfulValidations = validationResults.filter(r => r.success && r.withinTolerance);
    const failedValidations = validationResults.filter(r => r.success && !r.withinTolerance);
    
    console.log("📊 UPDATED SUMMARY STATISTICS:");
    console.log(`Total locations tested: ${validationResults.length}`);
    console.log(`API calls successful: ${successfulAPIs.length}`);
    console.log(`API calls failed: ${failedAPIs.length}`);
    console.log(`Validations within tolerance: ${successfulValidations.length}`);
    console.log(`Validations outside tolerance: ${failedValidations.length}`);
    
    const previousSuccessRate = 71.4;
    const currentSuccessRate = (successfulValidations.length / validationResults.length) * 100;
    const improvement = currentSuccessRate - previousSuccessRate;
    
    console.log(`\nPrevious success rate: ${previousSuccessRate}%`);
    console.log(`Current success rate: ${currentSuccessRate.toFixed(1)}%`);
    console.log(`Improvement: ${improvement.toFixed(1)}%`);
    
    if (successfulValidations.length > 0) {
        console.log(`\n✅ SUCCESSFUL VALIDATIONS:`);
        successfulValidations.forEach(result => {
            console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance`);
        });
    }
    
    if (failedValidations.length > 0) {
        console.log(`\n❌ FAILED VALIDATIONS:`);
        failedValidations.forEach(result => {
            console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance`);
        });
    }
    
    if (failedAPIs.length > 0) {
        console.log(`\n⚠️  API FAILURES:`);
        failedAPIs.forEach(result => {
            console.log(`  ${result.location}: ${result.error}`);
        });
    }
    
    // Component analysis
    const componentStats = {};
    successfulValidations.forEach(result => {
        Object.entries(result.componentResults).forEach(([component, data]) => {
            if (!componentStats[component]) {
                componentStats[component] = { total: 0, successful: 0, variances: [] };
            }
            componentStats[component].total++;
            if (data.withinTolerance) {
                componentStats[component].successful++;
            }
            componentStats[component].variances.push(data.variancePercent);
        });
    });
    
    console.log(`\n📈 COMPONENT ANALYSIS:`);
    Object.entries(componentStats).forEach(([component, stats]) => {
        const avgVariance = stats.variances.reduce((a, b) => a + b, 0) / stats.variances.length;
        const successRate = (stats.successful / stats.total) * 100;
        console.log(`  ${component}: ${stats.successful}/${stats.total} within tolerance (${successRate.toFixed(1)}%, avg variance: ${avgVariance.toFixed(1)}%)`);
    });
    
    console.log(`\n=== FINAL CONCLUSION ===`);
    if (currentSuccessRate >= 95) {
        console.log("🎉 EXCELLENT: T&T validation now exceeds 95% accuracy!");
        console.log("✅ T&T workflow ready for production");
    } else if (currentSuccessRate >= 85) {
        console.log("✅ GOOD: Significant improvement achieved");
        console.log("Minor adjustments needed for full production readiness");
    } else if (currentSuccessRate > previousSuccessRate) {
        console.log("⚠️ IMPROVED: Progress made but additional adjustments needed");
    } else {
        console.log("❌ Additional adjustments needed");
    }
    
    return {
        previousSuccessRate: previousSuccessRate,
        currentSuccessRate: currentSuccessRate,
        improvement: improvement,
        validationResults: validationResults,
        overallPassed: currentSuccessRate >= 85
    };
}

// Execute comprehensive re-validation
console.log("Starting comprehensive re-validation...");

const validationResults = await rerunComprehensiveValidation();
const updatedReport = generateUpdatedValidationReport(validationResults);

console.log("\n=== STEP 8 COMPLETE ===");
console.log("Comprehensive re-validation finished");

if (updatedReport.overallPassed) {
    console.log("✅ T&T system validation PASSED");
    console.log("Ready for production deployment");
} else {
    console.log("⚠️ T&T system needs additional refinement");
    console.log("Identify remaining issues for final optimization");
}