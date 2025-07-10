// Test Complete Package calculation for Tel Aviv
import fetch from 'node-fetch';

console.log("=== TESTING TEL AVIV COMPLETE PACKAGE ===");

async function testCompletePackage() {
    console.log("Testing Tel Aviv Complete Package with all components...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testProject = {
        name: "Tel Aviv Complete Package Test",
        country: "Israel",
        city: "Tel Aviv",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    const budgetConfig = {
        scope: "Complete Package",
        specification: "High",
        layout: "Activity", 
        primaryDataSource: "CBRE"
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: testProject,
                budget: budgetConfig
            })
        });
        
        if (!response.ok) {
            console.log(`❌ Request failed: HTTP ${response.status}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText}`);
            return;
        }
        
        const result = await response.json();
        
        console.log("\n🎯 TEL AVIV COMPLETE PACKAGE RESULTS:");
        console.log(`Location: ${testProject.city}, ${testProject.country}`);
        console.log(`Configuration: ${budgetConfig.layout} Layout, ${budgetConfig.specification} Specification`);
        console.log(`Area: ${testProject.totalArea} ${testProject.areaUnit}`);
        console.log("");
        
        // Calculate individual rates
        const fitoutRate = result.fitoutCost / testProject.totalArea;
        const furnitureRate = result.furnitureCost / testProject.totalArea;
        const technologyRate = result.technologyCost / testProject.totalArea;
        const totalRate = result.totalCost / testProject.totalArea;
        
        console.log("COMPONENT BREAKDOWN:");
        console.log(`Fitout: $${fitoutRate.toFixed(2)}/${testProject.areaUnit} (Total: $${result.fitoutCost.toFixed(2)})`);
        console.log(`Furniture: $${furnitureRate.toFixed(2)}/${testProject.areaUnit} (Total: $${result.furnitureCost.toFixed(2)})`);
        console.log(`Technology: $${technologyRate.toFixed(2)}/${testProject.areaUnit} (Total: $${result.technologyCost.toFixed(2)})`);
        console.log(`Professional Fees: $${((result.totalCost - result.fitoutCost - result.furnitureCost - result.technologyCost)).toFixed(2)}`);
        console.log("");
        console.log(`TOTAL RATE: $${totalRate.toFixed(2)}/${testProject.areaUnit}`);
        console.log(`TOTAL COST: $${result.totalCost.toFixed(2)}`);
        
        // Compare with individual tests
        console.log("\n📊 COMPARISON WITH INDIVIDUAL TESTS:");
        console.log("Expected from individual tests:");
        console.log("- Fitout: $1,170.97/sqm (verified)");
        console.log("- Technology: Should be ~$400/sqm for Tel Aviv");
        console.log("- Furniture: Should be ~$400/sqm for Tel Aviv");
        console.log("");
        console.log("Current Complete Package results:");
        console.log(`- Fitout: $${fitoutRate.toFixed(2)}/sqm`);
        console.log(`- Technology: $${technologyRate.toFixed(2)}/sqm`);
        console.log(`- Furniture: $${furnitureRate.toFixed(2)}/sqm`);
        
        // Validation
        const fitoutMatches = Math.abs(fitoutRate - 1170.97) < 1;
        console.log(`\n✅ Fitout rate matches: ${fitoutMatches ? 'YES' : 'NO'}`);
        
        if (result.datasetInfo) {
            console.log("\nData Source Info:");
            console.log(`Source: ${result.datasetInfo.source}`);
            console.log(`Location Match: ${result.datasetInfo.location}`);
            console.log(`Specification: ${result.datasetInfo.specification}`);
            console.log(`Layout: ${result.datasetInfo.layout}`);
        }
        
        return result;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return null;
    }
}

testCompletePackage();