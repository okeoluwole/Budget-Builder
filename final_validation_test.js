// Final comprehensive validation test to confirm all data extraction issues are resolved
import fetch from 'node-fetch';

console.log("=== FINAL COMPREHENSIVE VALIDATION TEST ===");

async function finalValidationTest() {
    const testMatrix = [
        // Test all scopes with London Team High (user's specific case)
        { location: "London, United Kingdom", layout: "Team", spec: "High", scope: "Technology", expectedRate: 396.91 },
        { location: "London, United Kingdom", layout: "Team", spec: "High", scope: "Fitout", expectedRate: 2617.63 },
        { location: "London, United Kingdom", layout: "Team", spec: "High", scope: "Furniture", expectedRate: 489.38 },
        { location: "London, United Kingdom", layout: "Team", spec: "High", scope: "Complete", expectedTotal: 4029.51 },
        
        // Test other layouts and specifications
        { location: "London, United Kingdom", layout: "Activity", spec: "High", scope: "Technology", expectedRate: 396.91 },
        { location: "New York, United States", layout: "Activity", spec: "Medium", scope: "Complete", expectedTotal: null }, // Dynamic check
        { location: "Singapore, Singapore", layout: "Team", spec: "Low", scope: "Complete", expectedTotal: null }
    ];
    
    let passCount = 0;
    let totalTests = testMatrix.length;
    
    for (const test of testMatrix) {
        const [city, country] = test.location.split(", ");
        console.log(`\nTesting: ${test.location} - ${test.layout} - ${test.spec} - ${test.scope}`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        name: `Test ${test.scope}`,
                        country: country,
                        city: city,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        scope: test.scope,
                        specification: test.spec,
                        layout: test.layout,
                        primaryDataSource: "CBRE"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const unitCost = result.totalCost / 1000;
                
                let validationPassed = false;
                
                if (test.scope === "Technology" && test.expectedRate) {
                    const techRate = result.technologyCost / 1000;
                    validationPassed = Math.abs(techRate - test.expectedRate) < 1;
                    console.log(`  ✅ Technology: $${techRate.toFixed(2)}/sqm (expected: $${test.expectedRate}/sqm) ${validationPassed ? '✅' : '❌'}`);
                } else if (test.scope === "Fitout" && test.expectedRate) {
                    const fitoutRate = result.fitoutCost / 1000;
                    validationPassed = Math.abs(fitoutRate - test.expectedRate) < 1;
                    console.log(`  ✅ Fitout: $${fitoutRate.toFixed(2)}/sqm (expected: $${test.expectedRate}/sqm) ${validationPassed ? '✅' : '❌'}`);
                } else if (test.scope === "Furniture" && test.expectedRate) {
                    const furnitureRate = result.furnitureCost / 1000;
                    validationPassed = Math.abs(furnitureRate - test.expectedRate) < 1;
                    console.log(`  ✅ Furniture: $${furnitureRate.toFixed(2)}/sqm (expected: $${test.expectedRate}/sqm) ${validationPassed ? '✅' : '❌'}`);
                } else if (test.scope === "Complete") {
                    if (test.expectedTotal) {
                        validationPassed = Math.abs(unitCost - test.expectedTotal) < 5;
                        console.log(`  ✅ Complete: $${unitCost.toFixed(2)}/sqm (expected: $${test.expectedTotal}/sqm) ${validationPassed ? '✅' : '❌'}`);
                    } else {
                        validationPassed = unitCost > 0; // Just check that we get a valid result
                        console.log(`  ✅ Complete: $${unitCost.toFixed(2)}/sqm (valid result) ✅`);
                    }
                    
                    // Show component breakdown for Complete scope
                    console.log(`    Components:`);
                    console.log(`      Technology: $${(result.technologyCost / 1000).toFixed(2)}/sqm`);
                    console.log(`      Fitout: $${(result.fitoutCost / 1000).toFixed(2)}/sqm`);
                    console.log(`      Furniture: $${(result.furnitureCost / 1000).toFixed(2)}/sqm`);
                    if (result.costsBreakdown['PROFESSIONAL FEES']) {
                        console.log(`      Professional Fees: $${(result.costsBreakdown['PROFESSIONAL FEES'] / 1000).toFixed(2)}/sqm`);
                    }
                }
                
                if (validationPassed) {
                    passCount++;
                    console.log(`  ✅ TEST PASSED`);
                } else {
                    console.log(`  ❌ TEST FAILED - Rate validation failed`);
                }
                
            } else {
                const error = await response.json();
                console.log(`  ❌ API ERROR: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`  ❌ NETWORK ERROR: ${error.message}`);
        }
    }
    
    console.log(`\n=== FINAL VALIDATION RESULTS ===`);
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${totalTests - passCount}`);
    console.log(`Success rate: ${((passCount / totalTests) * 100).toFixed(1)}%`);
    
    if (passCount === totalTests) {
        console.log(`🎯 ALL TESTS PASSED - Data extraction is working correctly!`);
        console.log(`The application now pulls accurate rates across all locations, layouts, and scopes.`);
    } else {
        console.log(`⚠️ Some tests failed - further investigation needed.`);
    }
}

finalValidationTest();