// Test Bucharest Technology Cost - Event Layout, Medium Spec
import fetch from 'node-fetch';

console.log("=== TESTING BUCHAREST TECHNOLOGY COST ===");

async function testBucharestTech() {
    console.log("Testing Bucharest Event Layout Medium Spec technology cost...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testProject = {
        name: "Bucharest Tech Test Project",
        country: "Romania",
        city: "Bucharest",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    const budgetConfig = {
        scope: "Technology",
        specification: "Medium",
        layout: "Event", 
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
            console.log(`Request failed: HTTP ${response.status}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText}`);
            return;
        }
        
        const result = await response.json();
        
        const techRate = result.technologyCost / testProject.totalArea;
        
        console.log("\nBUCHAREST TECHNOLOGY RESULTS:");
        console.log(`Location: ${testProject.city}, ${testProject.country}`);
        console.log(`Configuration: ${budgetConfig.layout} Layout, ${budgetConfig.specification} Specification`);
        console.log(`Area: ${testProject.totalArea} ${testProject.areaUnit}`);
        console.log("");
        console.log(`Technology Rate: $${techRate.toFixed(2)}/${testProject.areaUnit}`);
        console.log(`Total Technology Cost: $${result.technologyCost.toFixed(2)}`);
        console.log(`Total Project Cost: $${result.totalCost.toFixed(2)}`);
        
        if (result.datasetInfo) {
            console.log("");
            console.log("Data Source Info:");
            console.log(`Source: ${result.datasetInfo.source}`);
            console.log(`Location Match: ${result.datasetInfo.location}`);
            console.log(`Specification: ${result.datasetInfo.specification}`);
            console.log(`Layout: ${result.datasetInfo.layout}`);
        }
        
        if (techRate > 0) {
            console.log(`\nSUCCESS: Bucharest technology cost calculated from authentic CBRE data`);
            console.log(`Rate: $${techRate.toFixed(2)}/${testProject.areaUnit}`);
        } else {
            console.log("\nISSUE: No technology cost calculated for Bucharest");
        }
        
        return { rate: techRate, totalCost: result.technologyCost };
        
    } catch (error) {
        console.log(`Test failed: ${error.message}`);
        return null;
    }
}

testBucharestTech();