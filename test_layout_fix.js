/**
 * Test Layout Fix for Multi-Source Comparison
 * Tests CBRE vs T&T to ensure T&T properly ignores layout parameter
 */

async function testLayoutFix() {
  console.log("=== TESTING LAYOUT FIX FOR MULTI-SOURCE COMPARISON ===");
  
  const testProject = {
    id: 0,
    name: "Layout Test",
    reference: "LT001",
    country: "United Kingdom",
    city: "London",
    totalArea: 1000,
    areaUnit: "sqm",
    startDate: "2025-07-26",
    currency: "USD",
    inflationRate: null,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testBudget = {
    primaryDataSource: "CBRE",
    isComparisonEnabled: true,
    comparisonSources: ["TT"],
    scope: "Complete",
    specification: "High (Gold)",
    fitoutSpecification: "High (Gold)",
    furnitureSpecification: "Medium (Silver)",
    technologySpecification: "High (Gold)",
    layout: "Event", // This should work for CBRE but be ignored by T&T
    spaceAllocation: {
      "Open workspace": { percentage: 50, area: 500 },
      "Meeting rooms": { percentage: 25, area: 250 },
      "Focus areas": { percentage: 15, area: 150 },
      "Support spaces": { percentage: 10, area: 100 }
    }
  };

  try {
    console.log("📊 Testing multi-guide calculation with Event layout...");
    console.log("Project:", { country: testProject.country, city: testProject.city });
    console.log("Budget:", { 
      primary: testBudget.primaryDataSource,
      comparison: testBudget.comparisonSources,
      layout: testBudget.layout,
      specification: testBudget.specification 
    });

    const response = await fetch('/api/calculate-multi-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': document.cookie // Pass session cookies
      },
      body: JSON.stringify({
        primaryGuide: testBudget.primaryDataSource,
        comparisonGuides: testBudget.comparisonSources,
        project: testProject,
        budget: testBudget
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log("✅ Multi-guide calculation successful!");
    
    console.log("📈 Primary (CBRE) Result:", {
      totalCost: result.primary?.result?.totalCost,
      currency: result.primary?.result?.localCurrencyCode,
      layout: result.primary?.result?.datasetInfo?.layout
    });

    console.log("📊 Comparison Results:");
    result.comparisons?.forEach(comp => {
      console.log(`  ${comp.guideName}:`, {
        totalCost: comp.result?.totalCost,
        currency: comp.result?.localCurrencyCode,
        availability: comp.dataAvailability,
        layoutNote: comp.result?.datasetInfo?.layoutNote,
        error: comp.error
      });
    });

    console.log("📝 Mapping Notes:");
    result.mappingNotes?.forEach(note => console.log(`  - ${note}`));

    return result;

  } catch (error) {
    console.error("❌ Test failed:", error);
    return null;
  }
}

// Run the test
testLayoutFix().then(result => {
  if (result) {
    console.log("🎯 Layout fix test completed successfully!");
  } else {
    console.log("💥 Layout fix test failed!");
  }
});
