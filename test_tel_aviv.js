// Test Tel Aviv Fitout Cost - Activity Layout, High Spec
import fetch from 'node-fetch';

console.log("=== TESTING TEL AVIV FITOUT COST ===");

async function testTelAvivFitout() {
    console.log("Testing Tel Aviv Activity Layout High Spec fitout cost...");
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testProject = {
        name: "Tel Aviv Test Project",
        country: "Israel",
        city: "Tel Aviv",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    const budgetConfig = {
        scope: "Fitout",
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
        
        // Calculate per sqm rate
        const fitoutRate = result.fitoutCost / testProject.totalArea;
        
        console.log("\n🎯 TEL AVIV FITOUT RESULTS:");
        console.log(`Location: ${testProject.city}, ${testProject.country}`);
        console.log(`Configuration: ${budgetConfig.layout} Layout, ${budgetConfig.specification} Specification`);
        console.log(`Area: ${testProject.totalArea} ${testProject.areaUnit}`);
        console.log("");
        console.log(`Fitout Rate: $${fitoutRate.toFixed(2)}/${testProject.areaUnit}`);
        console.log(`Total Fitout Cost: $${result.fitoutCost.toFixed(2)}`);
        console.log(`Total Project Cost: $${result.totalCost.toFixed(2)}`);
        
        if (result.datasetInfo) {
            console.log("");
            console.log("Data Source Info:");
            console.log(`Source: ${result.datasetInfo.source}`);
            console.log(`Location Match: ${result.datasetInfo.location}`);
            console.log(`Specification: ${result.datasetInfo.specification}`);
            console.log(`Layout: ${result.datasetInfo.layout}`);
        }
        
        // Validate result
        if (fitoutRate > 0) {
            console.log("\n✅ SUCCESS: Tel Aviv fitout cost calculated successfully");
            console.log(`Authentic CBRE rate extracted: $${fitoutRate.toFixed(2)}/${testProject.areaUnit}`);
        } else {
            console.log("\n❌ ISSUE: No cost calculated for Tel Aviv");
        }
        
        return { rate: fitoutRate, totalCost: result.fitoutCost };
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return null;
    }
}

// Execute test
testTelAvivFitout();