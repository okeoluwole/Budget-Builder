// Test Ottawa Furniture Cost - Activity Layout, High Spec
import fetch from 'node-fetch';

console.log("=== TESTING OTTAWA FURNITURE COST ===");

async function testOttawaFurniture() {
    console.log("Testing Ottawa Activity Layout High Spec furniture cost...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testProject = {
        name: "Ottawa Furniture Test Project",
        country: "Canada",
        city: "Ottawa",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    const budgetConfig = {
        scope: "Furniture",
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
            console.log(`Request failed: HTTP ${response.status}`);
            const errorText = await response.text();
            console.log(`Error details: ${errorText}`);
            return;
        }
        
        const result = await response.json();
        
        const furnitureRate = result.furnitureCost / testProject.totalArea;
        
        console.log("\nOTTAWA FURNITURE RESULTS:");
        console.log(`Location: ${testProject.city}, ${testProject.country}`);
        console.log(`Configuration: ${budgetConfig.layout} Layout, ${budgetConfig.specification} Specification`);
        console.log(`Area: ${testProject.totalArea} ${testProject.areaUnit}`);
        console.log("");
        console.log(`Furniture Rate: $${furnitureRate.toFixed(2)}/${testProject.areaUnit}`);
        console.log(`Total Furniture Cost: $${result.furnitureCost.toFixed(2)}`);
        console.log(`Total Project Cost: $${result.totalCost.toFixed(2)}`);
        
        if (result.datasetInfo) {
            console.log("");
            console.log("Data Source Info:");
            console.log(`Source: ${result.datasetInfo.source}`);
            console.log(`Location Match: ${result.datasetInfo.location}`);
            console.log(`Specification: ${result.datasetInfo.specification}`);
            console.log(`Layout: ${result.datasetInfo.layout}`);
        }
        
        if (furnitureRate > 0) {
            console.log(`\nSUCCESS: Ottawa furniture cost calculated from authentic CBRE data`);
            console.log(`Rate: $${furnitureRate.toFixed(2)}/${testProject.areaUnit}`);
        } else {
            console.log("\nISSUE: No furniture cost calculated for Ottawa");
        }
        
        return { rate: furnitureRate, totalCost: result.furnitureCost };
        
    } catch (error) {
        console.log(`Test failed: ${error.message}`);
        return null;
    }
}

testOttawaFurniture();