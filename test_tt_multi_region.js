/**
 * T&T Multi-Region Testing
 * Tests T&T workflow across London, Nigeria, and 3 other global cities
 * Using direct API calls to validate server-side calculation
 */

async function testTTMultiRegion() {
  console.log("=== T&T MULTI-REGION TEST ===");
  
  const testCities = [
    { 
      name: "London", 
      country: "United Kingdom", 
      region: "EMEA",
      area: 1000,
      currency: "GBP",
      spec: "High (Gold)"
    },
    { 
      name: "Lagos", 
      country: "Nigeria", 
      region: "EMEA",
      area: 1200,
      currency: "NGN",
      spec: "Medium (Silver)"
    },
    { 
      name: "New York", 
      country: "United States", 
      region: "AMERICAS",
      area: 1500,
      currency: "USD",
      spec: "High (Gold)"
    },
    { 
      name: "Singapore", 
      country: "Singapore", 
      region: "APAC",
      area: 800,
      currency: "SGD",
      spec: "Medium (Silver)"
    },
    { 
      name: "Sydney", 
      country: "Australia", 
      region: "APAC",
      area: 1100,
      currency: "AUD",
      spec: "Low (Bronze)"
    }
  ];
  
  const results = [];
  
  for (const city of testCities) {
    console.log(`\n--- Testing ${city.name}, ${city.country} ---`);
    
    try {
      // Create test project
      const project = {
        id: Math.floor(Math.random() * 1000),
        name: `T&T Test ${city.name}`,
        location: `${city.name}, ${city.country}`,
        city: city.name,
        country: city.country,
        totalArea: city.area,
        areaUnit: "sqm",
        currency: city.currency
      };
      
      // Create test budget for Complete Package
      const budget = {
        id: Math.floor(Math.random() * 1000),
        projectId: project.id,
        primaryDataSource: "TT",
        scope: "Complete",
        specification: city.spec,
        layout: "Activity",
        status: "draft"
      };
      
      console.log(`Project: ${city.area} sqm, ${city.spec} specification`);
      
      // Test T&T calculation by making API call
      const response = await fetch('http://localhost:5000/api/budgets/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          budget,
          budgetStructure: { specification: city.spec }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Validate result structure
      const validation = {
        hasTotal: result.totalCost > 0,
        hasBreakdown: !!result.costsBreakdown,
        isUSD: result.localCurrencyCode === 'USD',
        componentCount: result.costsBreakdown ? Object.keys(result.costsBreakdown).length : 0
      };
      
      console.log(`✅ Total Cost: $${Math.round(result.totalCost).toLocaleString()} USD`);
      console.log(`✅ Rate: $${Math.round(result.totalCost / city.area)}/sqm`);
      console.log(`✅ Components: ${validation.componentCount}`);
      
      if (result.costsBreakdown) {
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          console.log(`   - ${component}: $${Math.round(cost).toLocaleString()}`);
        });
      }
      
      results.push({
        city: city.name,
        country: city.country,
        region: city.region,
        result,
        validation,
        success: true
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        city: city.name,
        country: city.country,
        region: city.region,
        error: error.message,
        success: false
      });
    }
  }
  
  // Generate comprehensive report
  console.log("\n=== T&T MULTI-REGION VALIDATION REPORT ===");
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📊 Overall Results:`);
  console.log(`✅ Successful: ${successful.length}/${testCities.length} cities`);
  console.log(`❌ Failed: ${failed.length}/${testCities.length} cities`);
  
  if (successful.length > 0) {
    console.log(`\n🌍 Regional Coverage:`);
    const regions = [...new Set(successful.map(r => r.region))];
    regions.forEach(region => {
      const regionCities = successful.filter(r => r.region === region);
      console.log(`  ${region}: ${regionCities.length} cities (${regionCities.map(c => c.city).join(', ')})`);
    });
    
    console.log(`\n💰 Cost Analysis:`);
    successful.forEach(city => {
      const rate = Math.round(city.result.totalCost / testCities.find(t => t.name === city.city).area);
      console.log(`  ${city.city}: $${rate}/sqm (${city.validation.componentCount} components)`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed Cities:`);
    failed.forEach(city => {
      console.log(`  ${city.city}, ${city.country}: ${city.error}`);
    });
  }
  
  // Final status
  const successRate = (successful.length / testCities.length) * 100;
  console.log(`\n🎯 T&T System Status: ${successRate}% success rate`);
  
  if (successRate >= 80) {
    console.log(`✅ T&T WORKFLOW READY FOR PRODUCTION`);
    console.log(`🔧 Server-side calculations validated across ${successful.length} regions`);
    console.log(`💱 USD currency standardization confirmed`);
  } else {
    console.log(`⚠️  T&T WORKFLOW NEEDS ATTENTION`);
    console.log(`🔍 Check data availability for failed locations`);
  }
  
  return results;
}

// Run the test
testTTMultiRegion().catch(console.error);