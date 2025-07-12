/**
 * STEP 6: Verify T&T Rate Adjustments
 * Test the adjusted rates against PDF source document
 */

console.log("=== STEP 6: VERIFYING T&T RATE ADJUSTMENTS ===");

async function testAdjustedRates() {
    console.log("Testing adjusted Germany/Munich and UK/London rates...");
    
    const testLocations = [
        { country: "Germany", city: "Munich" },
        { country: "United Kingdom", city: "London" }
    ];
    
    const testResults = [];
    
    for (const location of testLocations) {
        console.log(`\nTesting ${location.country}/${location.city}...`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        city: location.city,
                        country: location.country,
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
                const result = await response.json();
                const systemTotal = result.rawUnitCost;
                const breakdown = result.costsBreakdown;
                
                // Expected values from PDF source document
                const expectedRates = {
                    "Germany/Munich": { total: 4055, construction: 3224, looseFurniture: 238, audioVisual: 53, professionalFees: 540 },
                    "United Kingdom/London": { total: 5500, construction: 3801, looseFurniture: 726, audioVisual: 339, professionalFees: 634 }
                };
                
                const locationKey = `${location.country}/${location.city}`;
                const expected = expectedRates[locationKey];
                
                const totalVariance = Math.abs(systemTotal - expected.total);
                const totalVariancePercent = (totalVariance / expected.total) * 100;
                
                console.log(`✅ API Success: ${systemTotal}/sqm`);
                console.log(`Expected: ${expected.total}/sqm`);
                console.log(`Variance: ${totalVariance}/sqm (${totalVariancePercent.toFixed(1)}%)`);
                
                // Test component breakdown
                const componentResults = {};
                const systemBreakdown = {
                    construction: Math.round(breakdown.Construction / 1000),
                    looseFurniture: Math.round(breakdown['Loose Furniture'] / 1000),
                    audioVisual: Math.round(breakdown['Audio-Visual'] / 1000),
                    professionalFees: Math.round(breakdown['Professional Fees'] / 1000)
                };
                
                Object.entries(systemBreakdown).forEach(([component, systemValue]) => {
                    const expectedValue = expected[component];
                    const componentVariance = Math.abs(systemValue - expectedValue);
                    const componentVariancePercent = (componentVariance / expectedValue) * 100;
                    
                    componentResults[component] = {
                        system: systemValue,
                        expected: expectedValue,
                        variance: componentVariance,
                        variancePercent: componentVariancePercent,
                        withinTolerance: componentVariancePercent <= 5
                    };
                    
                    console.log(`  ${component}: ${systemValue} vs ${expectedValue} (${componentVariancePercent.toFixed(1)}%)`);
                });
                
                testResults.push({
                    location: locationKey,
                    success: true,
                    systemTotal: systemTotal,
                    expectedTotal: expected.total,
                    totalVariance: totalVariance,
                    totalVariancePercent: totalVariancePercent,
                    withinTolerance: totalVariancePercent <= 5,
                    componentResults: componentResults
                });
                
            } else {
                console.log(`❌ API failed: HTTP ${response.status}`);
                testResults.push({
                    location: `${location.country}/${location.city}`,
                    success: false,
                    error: `HTTP ${response.status}`
                });
            }
        } catch (error) {
            console.log(`❌ API error: ${error.message}`);
            testResults.push({
                location: `${location.country}/${location.city}`,
                success: false,
                error: error.message
            });
        }
    }
    
    return testResults;
}

function generateValidationReport(testResults) {
    console.log("\n=== VALIDATION REPORT ===");
    
    const successful = testResults.filter(r => r.success && r.withinTolerance);
    const failed = testResults.filter(r => !r.success || !r.withinTolerance);
    
    console.log(`Total tests: ${testResults.length}`);
    console.log(`Successful adjustments: ${successful.length}`);
    console.log(`Failed adjustments: ${failed.length}`);
    
    if (successful.length > 0) {
        console.log(`\n✅ SUCCESSFUL ADJUSTMENTS:`);
        successful.forEach(result => {
            console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance`);
        });
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ FAILED ADJUSTMENTS:`);
        failed.forEach(result => {
            if (result.success) {
                console.log(`  ${result.location}: ${result.totalVariancePercent.toFixed(1)}% variance (outside tolerance)`);
            } else {
                console.log(`  ${result.location}: ${result.error}`);
            }
        });
    }
    
    const successRate = (successful.length / testResults.length) * 100;
    console.log(`\nSuccess rate: ${successRate.toFixed(1)}%`);
    
    if (successRate === 100) {
        console.log("🎉 EXCELLENT: Rate adjustments successful!");
        console.log("Germany/Munich and UK/London now match PDF source document");
    } else {
        console.log("⚠️ Additional adjustments may be needed");
    }
    
    return {
        successRate: successRate,
        successful: successful.length,
        failed: failed.length,
        testResults: testResults
    };
}

// Execute verification
console.log("Starting rate adjustment verification...");

const testResults = await testAdjustedRates();
const report = generateValidationReport(testResults);

console.log("\n=== STEP 6 VERIFICATION COMPLETE ===");
console.log("Rate adjustment verification finished");

if (report.successRate === 100) {
    console.log("✅ Ready to proceed with comprehensive re-validation");
} else {
    console.log("❌ Additional rate adjustments needed");
}