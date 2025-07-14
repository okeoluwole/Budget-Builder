/**
 * Test Individual Component Specifications Fix
 * Validates that server-side CBRE calculation respects fitoutSpecification, furnitureSpecification, technologySpecification
 */

async function testIndividualComponentSpecs() {
  console.log("=== TESTING INDIVIDUAL COMPONENT SPECIFICATIONS FIX ===");
  
  try {
    const testConfig = {
      project: {
        id: 0,
        name: 'Component Spec Test',
        reference: 'TEST-001',
        country: 'United Kingdom',
        city: 'London', 
        totalArea: 1000,
        areaUnit: 'sqm',
        currency: 'USD',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      budget: {
        primaryDataSource: 'CBRE',
        scope: 'Complete Package',
        specification: 'Medium (Silver)', // General specification
        fitoutSpecification: 'Medium (Silver)', // Should use this for fitout
        furnitureSpecification: 'High (Gold)', // Should use this for furniture 
        technologySpecification: 'High (Gold)', // Should use this for technology
        layout: 'Activity',
        spaceAllocation: {
          'Open workspace': { percentage: 50, area: 500 },
          'Meeting rooms': { percentage: 25, area: 250 },
          'Focus areas': { percentage: 15, area: 150 },
          'Support spaces': { percentage: 10, area: 100 }
        }
      }
    };
    
    console.log("1. Testing with Mixed Component Specifications:");
    console.log("   - Fitout: Medium (Silver)");
    console.log("   - Furniture: High (Gold)");
    console.log("   - Technology: High (Gold)");
    console.log("");
    
    const response = await fetch('http://localhost:5000/api/calculate-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ CBRE calculation successful!");
      console.log("📊 Results Analysis:");
      console.log(`   Total Cost: $${result.totalCost?.toLocaleString() || 'N/A'}`);
      console.log(`   Currency: ${result.localCurrencyCode || 'N/A'}`);
      console.log("");
      
      console.log("💰 Component Breakdown:");
      if (result.costsBreakdown) {
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          const rate = Math.round(cost / 1000);
          console.log(`   ${component}: $${cost.toLocaleString()} ($${rate}/sqm)`);
        });
      }
      console.log("");
      
      // Verify that different specifications are reflected in the rates
      const fitoutCost = result.costsBreakdown?.['FITOUT COSTS'] || 0;
      const furnitureCost = result.costsBreakdown?.['FURNITURE COSTS'] || 0;
      const techCost = result.costsBreakdown?.['TECHNOLOGY COSTS'] || 0;
      
      const fitoutRate = Math.round(fitoutCost / 1000);
      const furnitureRate = Math.round(furnitureCost / 1000);
      const techRate = Math.round(techCost / 1000);
      
      console.log("🔍 Specification Validation:");
      console.log(`   Fitout (Medium): $${fitoutRate}/sqm`);
      console.log(`   Furniture (High): $${furnitureRate}/sqm`);
      console.log(`   Technology (High): $${techRate}/sqm`);
      console.log("");
      
      // Expected behavior: High specification should have higher rates than Medium
      if (furnitureRate > fitoutRate && techRate > fitoutRate) {
        console.log("✅ SPECIFICATION FIX SUCCESSFUL!");
        console.log("   High (Gold) components show higher rates than Medium (Silver)");
        console.log("   Individual component specifications are being respected!");
      } else {
        console.log("❌ SPECIFICATION ISSUE DETECTED");
        console.log("   All components showing similar rates - individual specs may not be working");
      }
      
      return { success: true, result };
      
    } else {
      const error = await response.text();
      console.error("❌ CBRE calculation failed:", error);
      return { success: false, error };
    }
    
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testIndividualComponentSpecs();
