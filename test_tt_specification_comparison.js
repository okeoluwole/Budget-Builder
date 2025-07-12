/**
 * T&T Specification Level Comparison
 * Tests same specification across multiple cities to show rate variations
 */

async function testTTSpecificationComparison() {
  console.log("=== T&T SPECIFICATION COMPARISON TEST ===");
  
  // Test Medium (Silver) specification across different cities
  const mediumSpecTests = [
    {
      name: "London Medium",
      project: { city: "London", country: "United Kingdom", totalArea: 1000, areaUnit: "sqm", currency: "GBP" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "Medium (Silver)", layout: "Activity" }
    },
    {
      name: "New York Medium", 
      project: { city: "New York", country: "United States", totalArea: 1000, areaUnit: "sqm", currency: "USD" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "Medium (Silver)", layout: "Activity" }
    },
    {
      name: "Singapore Medium",
      project: { city: "Singapore", country: "Singapore", totalArea: 1000, areaUnit: "sqm", currency: "SGD" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "Medium (Silver)", layout: "Activity" }
    }
  ];
  
  console.log("Testing Medium (Silver) specification across cities:");
  
  for (const test of mediumSpecTests) {
    try {
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: test.project, budget: test.budget })
      });
      
      const result = await response.json();
      const area = test.project.totalArea;
      
      console.log(`\n${test.name}:`);
      console.log(`  Total Rate: ${Math.round(result.totalCost / area)}/sqm`);
      
      if (result.costsBreakdown) {
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          console.log(`  ${component}: ${Math.round(cost / area)}/sqm`);
        });
      }
      
    } catch (error) {
      console.log(`${test.name}: Error - ${error.message}`);
    }
  }
  
  // Test High (Gold) specification across different cities
  console.log("\n\nTesting High (Gold) specification across cities:");
  
  const highSpecTests = [
    {
      name: "London High",
      project: { city: "London", country: "United Kingdom", totalArea: 1000, areaUnit: "sqm", currency: "GBP" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "High (Gold)", layout: "Activity" }
    },
    {
      name: "New York High",
      project: { city: "New York", country: "United States", totalArea: 1000, areaUnit: "sqm", currency: "USD" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "High (Gold)", layout: "Activity" }
    },
    {
      name: "Singapore High",
      project: { city: "Singapore", country: "Singapore", totalArea: 1000, areaUnit: "sqm", currency: "SGD" },
      budget: { primaryDataSource: "TT", scope: "Complete", specification: "High (Gold)", layout: "Activity" }
    }
  ];
  
  for (const test of highSpecTests) {
    try {
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: test.project, budget: test.budget })
      });
      
      const result = await response.json();
      const area = test.project.totalArea;
      
      console.log(`\n${test.name}:`);
      console.log(`  Total Rate: ${Math.round(result.totalCost / area)}/sqm`);
      
      if (result.costsBreakdown) {
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          console.log(`  ${component}: ${Math.round(cost / area)}/sqm`);
        });
      }
      
    } catch (error) {
      console.log(`${test.name}: Error - ${error.message}`);
    }
  }
}

testTTSpecificationComparison().catch(console.error);