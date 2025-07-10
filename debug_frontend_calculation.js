// Debug frontend calculation vs server calculation
import fetch from 'node-fetch';

console.log("=== DEBUGGING FRONTEND VS SERVER CALCULATION ===");

async function debugFrontendCalculation() {
    console.log("Debugging Tel Aviv Complete Package calculation...");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test what the frontend is sending
    const testProject = {
        name: "Tel Aviv Debug Test",
        country: "Israel",
        city: "Tel Aviv",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    // Test different specification combinations
    const testConfigs = [
        {
            scope: "Complete Package",
            specification: "High",
            layout: "Activity", 
            primaryDataSource: "CBRE"
        },
        {
            scope: "Complete Package",
            specification: "High (Gold)",
            layout: "Activity", 
            primaryDataSource: "CBRE"
        },
        {
            scope: "Complete Package",
            specification: "Gold",
            layout: "Activity", 
            primaryDataSource: "CBRE"
        },
        {
            scope: "Complete Package",
            specification: "High",
            layout: "Event", 
            primaryDataSource: "CBRE"
        }
    ];
    
    for (const config of testConfigs) {
        try {
            console.log(`\n--- Testing: ${config.specification} ${config.layout} ---`);
            
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: testProject,
                    budget: config
                })
            });
            
            if (!response.ok) {
                console.log(`❌ Request failed: HTTP ${response.status}`);
                const errorText = await response.text();
                console.log(`Error details: ${errorText}`);
                continue;
            }
            
            const result = await response.json();
            
            // Calculate rates
            const fitoutRate = result.fitoutCost / testProject.totalArea;
            const furnitureRate = result.furnitureCost / testProject.totalArea;
            const technologyRate = result.technologyCost / testProject.totalArea;
            const totalRate = result.totalCost / testProject.totalArea;
            
            console.log(`Fitout: $${fitoutRate.toFixed(2)}/sqm`);
            console.log(`Furniture: $${furnitureRate.toFixed(2)}/sqm`);
            console.log(`Technology: $${technologyRate.toFixed(2)}/sqm`);
            console.log(`Total: $${totalRate.toFixed(2)}/sqm`);
            
            if (result.datasetInfo) {
                console.log(`Source: ${result.datasetInfo.source}, Spec: ${result.datasetInfo.specification}, Layout: ${result.datasetInfo.layout}`);
            }
            
        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
}

debugFrontendCalculation();