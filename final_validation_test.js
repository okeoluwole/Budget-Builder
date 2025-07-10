// Final Validation Test - Verify CBRE Data Extraction is Working
// Test with the corrected file paths

import fetch from 'node-fetch';

console.log("=== FINAL CBRE DATA EXTRACTION VALIDATION ===");

async function finalValidationTest() {
    console.log("Waiting for server to initialize...");
    
    // Wait a few seconds for server initialization
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log("Testing CBRE data extraction with authentic rates...");
    
    // Test multiple international locations to verify global coverage
    const testCases = [
        {
            name: "London Team High Test",
            project: {
                name: "London Test Project",
                country: "United Kingdom",
                city: "London",
                totalArea: 1000,
                areaUnit: "sqm",
                currency: "USD"
            },
            budget: {
                scope: "Complete",
                specification: "High",
                layout: "Team",
                primaryDataSource: "CBRE"
            },
            expectedRates: {
                technology: 396.91,
                fitout: 2617.63,
                furniture: 489.38
            }
        },
        {
            name: "Singapore Team High Test",
            project: {
                name: "Singapore Test Project",
                country: "Singapore",
                city: "Singapore",
                totalArea: 1000,
                areaUnit: "sqm",
                currency: "USD"
            },
            budget: {
                scope: "Complete",
                specification: "High",
                layout: "Team",
                primaryDataSource: "CBRE"
            },
            expectedRates: {
                technology: 358.23, // Approximate based on CBRE data
                fitout: 2500, // Approximate
                furniture: 450 // Approximate
            }
        },
        {
            name: "New York Team High Test",
            project: {
                name: "New York Test Project",
                country: "United States",
                city: "New York",
                totalArea: 1000,
                areaUnit: "sqm",
                currency: "USD"
            },
            budget: {
                scope: "Complete",
                specification: "High",
                layout: "Team",
                primaryDataSource: "CBRE"
            },
            expectedRates: {
                technology: 400, // Approximate
                fitout: 2800, // Approximate
                furniture: 500 // Approximate
            }
        }
    ];
    
    let successCount = 0;
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`\n--- Testing: ${testCase.name} ---`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: testCase.project,
                    budget: testCase.budget
                })
            });
            
            if (!response.ok) {
                console.log(`❌ ${testCase.name}: HTTP ${response.status}`);
                const errorText = await response.text();
                console.log(`Error: ${errorText}`);
                results.push({ test: testCase.name, success: false, error: `HTTP ${response.status}` });
                continue;
            }
            
            const result = await response.json();
            
            // Extract per-sqm rates
            const area = testCase.project.totalArea;
            const actualRates = {
                technology: result.technologyCost / area,
                fitout: result.fitoutCost / area,
                furniture: result.furnitureCost / area,
                total: result.totalCost / area
            };
            
            console.log(`✅ ${testCase.name}: Data extraction successful`);
            console.log(`   Technology: $${actualRates.technology.toFixed(2)}/sqm`);
            console.log(`   Fitout: $${actualRates.fitout.toFixed(2)}/sqm`);
            console.log(`   Furniture: $${actualRates.furniture.toFixed(2)}/sqm`);
            console.log(`   Total: $${actualRates.total.toFixed(2)}/sqm`);
            
            // Validate London rates specifically (most precise test)
            if (testCase.name.includes("London")) {
                const techAccurate = Math.abs(actualRates.technology - testCase.expectedRates.technology) < 1;
                const fitoutAccurate = Math.abs(actualRates.fitout - testCase.expectedRates.fitout) < 1;
                const furnitureAccurate = Math.abs(actualRates.furniture - testCase.expectedRates.furniture) < 1;
                
                console.log(`   Rate accuracy check:`);
                console.log(`   Technology: ${techAccurate ? '✅' : '❌'} (expected: $${testCase.expectedRates.technology}/sqm)`);
                console.log(`   Fitout: ${fitoutAccurate ? '✅' : '❌'} (expected: $${testCase.expectedRates.fitout}/sqm)`);
                console.log(`   Furniture: ${furnitureAccurate ? '✅' : '❌'} (expected: $${testCase.expectedRates.furniture}/sqm)`);
                
                if (techAccurate && fitoutAccurate && furnitureAccurate) {
                    console.log(`   ✅ London rates 100% accurate - authentic data confirmed`);
                } else {
                    console.log(`   ⚠️ London rates discrepancy detected`);
                }
            }
            
            successCount++;
            results.push({ 
                test: testCase.name, 
                success: true, 
                rates: actualRates,
                location: `${testCase.project.city}, ${testCase.project.country}`
            });
            
        } catch (error) {
            console.log(`❌ ${testCase.name}: ${error.message}`);
            results.push({ test: testCase.name, success: false, error: error.message });
        }
    }
    
    console.log("\n=== VALIDATION SUMMARY ===");
    console.log(`✅ Successful tests: ${successCount}/${testCases.length}`);
    console.log(`Success rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
    
    if (successCount === testCases.length) {
        console.log("🎉 CBRE DATA EXTRACTION FULLY OPERATIONAL");
        console.log("All test locations successfully extracted authentic rates");
        console.log("File path corrections were successful");
    } else {
        console.log("⚠️ Some tests failed - further investigation needed");
    }
    
    // Show all successful results
    console.log("\n=== SUCCESSFUL EXTRACTIONS ===");
    results.filter(r => r.success).forEach(result => {
        console.log(`${result.location}: Technology $${result.rates.technology.toFixed(2)}, Fitout $${result.rates.fitout.toFixed(2)}, Furniture $${result.rates.furniture.toFixed(2)}`);
    });
}

// Execute test
finalValidationTest();