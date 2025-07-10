// Validate London Team Layout Rates Across All Scopes
import fetch from 'node-fetch';

console.log("=== VALIDATING LONDON TEAM LAYOUT RATES ===");

async function testLondonTeamRates() {
    const testConfigs = [
        { scope: "Technology", expectedRate: 396.91 },
        { scope: "Fitout", expectedRate: 2617.63 },
        { scope: "Furniture", expectedRate: 489.38 },
        { scope: "Complete", expectedTotal: 4029.51 }
    ];
    
    const projectArea = 5000; // sqm
    
    for (const config of testConfigs) {
        console.log(`\n--- Testing ${config.scope} scope ---`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        name: `London ${config.scope} Test`,
                        country: "United Kingdom",
                        city: "London",
                        totalArea: projectArea,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        scope: config.scope,
                        specification: "High",
                        layout: "Team",
                        primaryDataSource: "CBRE"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const actualUnitCost = result.totalCost / projectArea;
                
                console.log(`✅ ${config.scope} calculation successful`);
                console.log(`   Total cost: $${result.totalCost.toLocaleString()}`);
                console.log(`   Unit cost: $${actualUnitCost.toFixed(2)}/sqm`);
                
                if (config.scope === "Technology") {
                    const techRate = result.technologyCost / projectArea;
                    console.log(`   Technology rate: $${techRate.toFixed(2)}/sqm (expected: $${config.expectedRate}/sqm)`);
                    if (Math.abs(techRate - config.expectedRate) < 1) {
                        console.log(`   ✅ Rate matches database validation`);
                    } else {
                        console.log(`   ❌ Rate mismatch - needs investigation`);
                    }
                } else if (config.scope === "Fitout") {
                    const fitoutRate = result.fitoutCost / projectArea;
                    console.log(`   Fitout rate: $${fitoutRate.toFixed(2)}/sqm (expected: $${config.expectedRate}/sqm)`);
                    if (Math.abs(fitoutRate - config.expectedRate) < 1) {
                        console.log(`   ✅ Rate matches database validation`);
                    } else {
                        console.log(`   ❌ Rate mismatch - needs investigation`);
                    }
                } else if (config.scope === "Furniture") {
                    const furnitureRate = result.furnitureCost / projectArea;
                    console.log(`   Furniture rate: $${furnitureRate.toFixed(2)}/sqm (expected: $${config.expectedRate}/sqm)`);
                    if (Math.abs(furnitureRate - config.expectedRate) < 1) {
                        console.log(`   ✅ Rate matches database validation`);
                    } else {
                        console.log(`   ❌ Rate mismatch - needs investigation`);
                    }
                } else if (config.scope === "Complete") {
                    console.log(`   Total unit cost: $${actualUnitCost.toFixed(2)}/sqm (expected: $${config.expectedTotal}/sqm)`);
                    console.log(`   Component breakdown:`);
                    console.log(`     - Technology: $${(result.technologyCost / projectArea).toFixed(2)}/sqm`);
                    console.log(`     - Fitout: $${(result.fitoutCost / projectArea).toFixed(2)}/sqm`);
                    console.log(`     - Furniture: $${(result.furnitureCost / projectArea).toFixed(2)}/sqm`);
                    console.log(`     - Professional Fees: $${((result.costsBreakdown['PROFESSIONAL FEES'] || 0) / projectArea).toFixed(2)}/sqm`);
                }
                
            } else {
                const error = await response.json();
                console.log(`❌ ${config.scope} calculation failed: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`❌ ${config.scope} test error: ${error.message}`);
        }
    }
    
    console.log("\n=== VALIDATION SUMMARY ===");
    console.log("Testing London Team Layout High specification rates");
    console.log("Expected database rates:");
    console.log("  Technology: $396.91/sqm");
    console.log("  Fitout: $2,617.63/sqm");
    console.log("  Furniture: $489.38/sqm");
    console.log("These should match the application calculations exactly.");
}

testLondonTeamRates();